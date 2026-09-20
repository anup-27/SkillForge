-- ============================================================================
-- SkillForge Database Schema (PostgreSQL 14+)
-- Campus Micro-Internship & Task-Bounty Allocation Engine
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in reverse dependency order for clean migrations
DROP VIEW IF EXISTS view_student_leaderboard CASCADE;
DROP TABLE IF EXISTS payout_ledger CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS bounty_skills CASCADE;
DROP TABLE IF EXISTS bounties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 1. USERS TABLE (Students, Posters, Admins with Dedicated Escrow Tracking)
-- ============================================================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'POSTER', 'ADMIN')),
    wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (wallet_balance >= 0.00),
    escrow_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (escrow_balance >= 0.00),
    reputation_score INT NOT NULL DEFAULT 100 CHECK (reputation_score >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. BOUNTIES TABLE (Task Catalog)
-- ============================================================================
CREATE TABLE bounties (
    bounty_id SERIAL PRIMARY KEY,
    poster_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (
        category IN ('WEB_DEV', 'DESIGN', 'AI_ML', 'DATABASE', 'CONTENT', 'BUG_FIX')
    ),
    reward_amount DECIMAL(10, 2) NOT NULL CHECK (reward_amount > 0),
    max_claimants INT NOT NULL DEFAULT 1 CHECK (max_claimants >= 1),
    deadline TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (
        status IN ('OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'EXPIRED')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_deadline CHECK (deadline > created_at)
);

-- ============================================================================
-- 3. BOUNTY_SKILLS TABLE (Normalized Skill Tagging)
-- ============================================================================
CREATE TABLE bounty_skills (
    bounty_id INT NOT NULL REFERENCES bounties(bounty_id) ON DELETE CASCADE,
    skill_tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (bounty_id, skill_tag)
);

-- ============================================================================
-- 4. CLAIMS TABLE (Task Lifecycle Tracking)
-- ============================================================================
CREATE TABLE claims (
    claim_id SERIAL PRIMARY KEY,
    bounty_id INT NOT NULL REFERENCES bounties(bounty_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    claim_status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED' CHECK (
        claim_status IN ('ASSIGNED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ABANDONED')
    ),
    submission_url VARCHAR(500),
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    UNIQUE (bounty_id, student_id) -- Prevent double claims on the same bounty
);

-- ============================================================================
-- 5. PAYOUT_LEDGER TABLE (Immutable Financial Audit Trail)
-- ============================================================================
CREATE TABLE payout_ledger (
    payout_id SERIAL PRIMARY KEY,
    claim_id INT UNIQUE NOT NULL REFERENCES claims(claim_id) ON DELETE RESTRICT,
    from_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    to_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    transaction_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_distinct_users CHECK (from_user_id <> to_user_id)
);

-- ============================================================================
-- 6. PERFORMANCE & COVERING INDEXES
-- ============================================================================
CREATE INDEX idx_bounties_status_deadline ON bounties(status, deadline);
CREATE INDEX idx_bounties_poster ON bounties(poster_id);
CREATE INDEX idx_bounty_skills_tag ON bounty_skills(skill_tag, bounty_id);
CREATE INDEX idx_claims_bounty_status ON claims(bounty_id, claim_status);
CREATE INDEX idx_claims_student ON claims(student_id, claim_status);
CREATE INDEX idx_payout_ledger_users ON payout_ledger(from_user_id, to_user_id);

-- ============================================================================
-- 7. TRIGGER: BI-DIRECTIONAL CAPACITY & STATUS SYNC
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_sync_bounty_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_bounty_id INT;
    v_max INT;
    v_active_claims INT;
    v_current_status VARCHAR(20);
BEGIN
    v_bounty_id := COALESCE(NEW.bounty_id, OLD.bounty_id);

    -- Row-lock bounty to prevent race conditions during concurrent claiming
    SELECT max_claimants, status 
    INTO v_max, v_current_status 
    FROM bounties 
    WHERE bounty_id = v_bounty_id 
    FOR UPDATE;

    -- Only toggle if bounty is currently OPEN or IN_PROGRESS
    IF v_current_status IN ('OPEN', 'IN_PROGRESS') THEN
        SELECT COUNT(*) 
        INTO v_active_claims 
        FROM claims 
        WHERE bounty_id = v_bounty_id 
          AND claim_status IN ('ASSIGNED', 'SUBMITTED', 'APPROVED');

        IF v_active_claims >= v_max AND v_current_status = 'OPEN' THEN
            UPDATE bounties SET status = 'IN_PROGRESS' WHERE bounty_id = v_bounty_id;
        ELSIF v_active_claims < v_max AND v_current_status = 'IN_PROGRESS' THEN
            UPDATE bounties SET status = 'OPEN' WHERE bounty_id = v_bounty_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bounty_claim_sync ON claims;
CREATE TRIGGER trg_bounty_claim_sync
AFTER INSERT OR UPDATE OF claim_status OR DELETE ON claims
FOR EACH ROW
EXECUTE FUNCTION trg_sync_bounty_capacity();

-- ============================================================================
-- 8. STORED PROCEDURE: ATOMIC REVIEW & ESCROW RELEASE
-- ============================================================================
CREATE OR REPLACE PROCEDURE approve_submission_and_payout(
    p_claim_id INT,
    p_poster_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_bounty_id INT;
    v_student_id INT;
    v_reward DECIMAL(10, 2);
    v_poster_escrow DECIMAL(12, 2);
    v_claim_status VARCHAR(20);
    v_max_claimants INT;
    v_approved_count INT;
    v_pending_count INT;
BEGIN
    -- 1. Fetch and row-lock claim and bounty
    SELECT c.bounty_id, c.student_id, c.claim_status, b.reward_amount, b.max_claimants
    INTO v_bounty_id, v_student_id, v_claim_status, v_reward, v_max_claimants
    FROM claims c
    JOIN bounties b ON c.bounty_id = b.bounty_id
    WHERE c.claim_id = p_claim_id AND b.poster_id = p_poster_id
    FOR UPDATE OF c, b;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim % not found or poster % does not own this bounty.', p_claim_id, p_poster_id;
    END IF;

    IF v_claim_status <> 'SUBMITTED' THEN
        RAISE EXCEPTION 'Cannot approve claim % with status "%". It must be "SUBMITTED".', p_claim_id, v_claim_status;
    END IF;

    -- 2. Validate Poster's Escrow or Wallet balance
    SELECT escrow_balance INTO v_poster_escrow 
    FROM users 
    WHERE user_id = p_poster_id 
    FOR UPDATE;

    IF v_poster_escrow >= v_reward THEN
        -- Settle from locked escrow balance
        UPDATE users SET escrow_balance = escrow_balance - v_reward WHERE user_id = p_poster_id;
    ELSE
        -- Fallback to standard wallet balance
        UPDATE users SET wallet_balance = wallet_balance - v_reward WHERE user_id = p_poster_id;
    END IF;

    -- 3. Credit student wallet & increment reputation score
    UPDATE users 
    SET wallet_balance = wallet_balance + v_reward,
        reputation_score = reputation_score + 15
    WHERE user_id = v_student_id;

    -- 4. Record audit ledger entry
    INSERT INTO payout_ledger (claim_id, from_user_id, to_user_id, amount)
    VALUES (p_claim_id, p_poster_id, v_student_id, v_reward);

    -- 5. Update claim status to APPROVED
    UPDATE claims 
    SET claim_status = 'APPROVED', 
        reviewed_at = CURRENT_TIMESTAMP 
    WHERE claim_id = p_claim_id;

    -- 6. Check if all required claimant slots are fulfilled
    SELECT 
        COUNT(*) FILTER (WHERE claim_status = 'APPROVED'),
        COUNT(*) FILTER (WHERE claim_status IN ('ASSIGNED', 'SUBMITTED'))
    INTO v_approved_count, v_pending_count
    FROM claims
    WHERE bounty_id = v_bounty_id;

    -- Complete bounty only when quota is fulfilled and no active claims remain
    IF v_approved_count >= v_max_claimants OR v_pending_count = 0 THEN
        UPDATE bounties SET status = 'COMPLETED' WHERE bounty_id = v_bounty_id;
    END IF;
END;
$$;

-- ============================================================================
-- 9. VIEW: REAL-TIME STUDENT LEADERBOARD
-- ============================================================================
CREATE OR REPLACE VIEW view_student_leaderboard AS
SELECT 
    u.user_id,
    u.name,
    u.reputation_score,
    COUNT(c.claim_id) FILTER (WHERE c.claim_status = 'APPROVED') AS completed_tasks,
    ROUND(
        (COUNT(c.claim_id) FILTER (WHERE c.claim_status = 'APPROVED')::NUMERIC / 
         NULLIF(COUNT(c.claim_id), 0) * 100), 1
    ) AS completion_rate_pct,
    COALESCE(SUM(pl.amount), 0.00) AS total_earned_inr,
    ROUND(AVG(EXTRACT(EPOCH FROM (c.submitted_at - c.claimed_at)) / 3600) 
          FILTER (WHERE c.claim_status = 'APPROVED'), 2) AS avg_turnaround_hours,
    DENSE_RANK() OVER (
        ORDER BY COALESCE(SUM(pl.amount), 0.00) DESC, u.reputation_score DESC
    ) AS rank_position
FROM users u
LEFT JOIN claims c ON u.user_id = c.student_id
LEFT JOIN payout_ledger pl ON c.claim_id = pl.claim_id
WHERE u.role = 'STUDENT'
GROUP BY u.user_id, u.name, u.reputation_score;
