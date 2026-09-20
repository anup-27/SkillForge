-- ============================================================================
-- SkillForge Demo Seed Script
-- Realistic Campus Community Data
-- ============================================================================

-- 1. Insert Posters, Students, and Admins
INSERT INTO users (user_id, name, email, role, wallet_balance, escrow_balance, reputation_score, created_at) VALUES
-- Posters (Professors & Clubs)
(1, 'Dr. Ramesh Rao (AI Lab)', 'ramesh.rao@campus.edu', 'POSTER', 22500.00, 5000.00, 180, NOW() - INTERVAL '30 days'),
(2, 'ACM Student Chapter', 'acm@campus.edu', 'POSTER', 14500.00, 3500.00, 140, NOW() - INTERVAL '25 days'),
(3, 'Nexa Campus Incubator', 'ventures@incubator.edu', 'POSTER', 35000.00, 7500.00, 210, NOW() - INTERVAL '20 days'),

-- Students
(4, 'Aditi Sharma', 'aditi.s@student.campus.edu', 'STUDENT', 6500.00, 0.00, 145, NOW() - INTERVAL '28 days'),
(5, 'Rahul Verma', 'rahul.v@student.campus.edu', 'STUDENT', 4200.00, 0.00, 120, NOW() - INTERVAL '24 days'),
(6, 'Sneha Patel', 'sneha.p@student.campus.edu', 'STUDENT', 1800.00, 0.00, 110, NOW() - INTERVAL '15 days'),
(7, 'Karan Malhotra', 'karan.m@student.campus.edu', 'STUDENT', 500.00, 0.00, 100, NOW() - INTERVAL '10 days');

-- 2. Insert Bounties
INSERT INTO bounties (bounty_id, poster_id, title, description, category, reward_amount, max_claimants, deadline, status, created_at) VALUES
-- 1: Completed Task
(1, 1, 'FastAPI Token Refresh & JWT Bugfix', 'Fix token expiration refresh race condition in campus AI cluster portal.', 'BUG_FIX', 2500.00, 1, NOW() - INTERVAL '2 days', 'COMPLETED', NOW() - INTERVAL '10 days'),

-- 2: Under Review Task
(2, 2, 'Annual Hackathon Teaser Poster & Assets', 'Create high-res vector graphics and Instagram banner kit in Figma for HackFest 2026.', 'DESIGN', 1800.00, 1, NOW() + INTERVAL '3 days', 'UNDER_REVIEW', NOW() - INTERVAL '5 days'),

-- 3: In Progress Task (Capacity 2, both claimed)
(3, 3, 'PostgreSQL Sharding & Partition Benchmark', 'Write test harnesses for time-series student telemetry data using pg_partman.', 'DATABASE', 4500.00, 2, NOW() + INTERVAL '6 days', 'IN_PROGRESS', NOW() - INTERVAL '4 days'),

-- 4: Open Task (Skill: Python & PyTorch)
(4, 1, 'Quantize LLaMA-3 LoRA Weights to GGUF', 'Optimize 8B model checkpoint to 4-bit GGUF with perplexity benchmarks on student server.', 'AI_ML', 5000.00, 1, NOW() + INTERVAL '7 days', 'OPEN', NOW() - INTERVAL '2 days'),

-- 5: Open Task (Skill: Web Dev)
(5, 2, 'Club Membership Dashboard with React & Vite', 'Implement student sign-in and RFID badge verification UI with responsive dark mode.', 'WEB_DEV', 3500.00, 2, NOW() + INTERVAL '8 days', 'OPEN', NOW() - INTERVAL '1 day'),

-- 6: Open Task (Content & Documentation)
(6, 3, 'Draft Seed Funding Pitch Deck for EdTech Startup', 'Create an 8-slide executive pitch deck for AI teaching assistant grant.', 'CONTENT', 3000.00, 1, NOW() + INTERVAL '4 days', 'OPEN', NOW() - INTERVAL '12 hours');

-- 3. Tag Skills
INSERT INTO bounty_skills (bounty_id, skill_tag) VALUES
(1, 'Python'), (1, 'FastAPI'), (1, 'JWT'),
(2, 'Figma'), (2, 'Illustrator'), (2, 'Branding'),
(3, 'PostgreSQL'), (3, 'Partitioning'), (3, 'Benchmarking'),
(4, 'Python'), (4, 'PyTorch'), (4, 'LLM'), (4, 'Quantization'),
(5, 'React'), (5, 'JavaScript'), (5, 'CSS'), (5, 'Vite'),
(6, 'Pitch Deck'), (6, 'Copywriting'), (6, 'Financial Modeling');

-- 4. Insert Claims
INSERT INTO claims (claim_id, bounty_id, student_id, claim_status, submission_url, claimed_at, submitted_at, reviewed_at) VALUES
-- Claim 1: Approved and paid out
(1, 1, 4, 'APPROVED', 'https://github.com/campus-ai/portal-auth/pull/18', NOW() - INTERVAL '9 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),

-- Claim 2: Submitted by Sneha, waiting for review
(2, 2, 6, 'SUBMITTED', 'https://figma.com/file/hackfest-2026-design-kit', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day', NULL),

-- Claim 3 & 4: Claimed by Rahul and Karan for Bounty 3 (Capacity = 2)
(3, 3, 5, 'ASSIGNED', NULL, NOW() - INTERVAL '3 days', NULL, NULL),
(4, 3, 7, 'ASSIGNED', NULL, NOW() - INTERVAL '2 days', NULL, NULL);

-- 5. Insert Payout Ledger for Approved Claim
INSERT INTO payout_ledger (payout_id, claim_id, from_user_id, to_user_id, amount, transaction_time) VALUES
(1, 1, 1, 4, 2500.00, NOW() - INTERVAL '6 days');
