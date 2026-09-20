// ============================================================================
// SkillForge In-Memory Relational Engine with ACID Guarantees & Triggers
// Enforces PostgreSQL 14+ schema, checks, capacity triggers, and atomic payouts
// ============================================================================

export class SkillForgeDatabase {
  constructor() {
    this.users = [];
    this.bounties = [];
    this.bountySkills = [];
    this.claims = [];
    this.payoutLedger = [];

    this.nextUserId = 1;
    this.nextBountyId = 1;
    this.nextClaimId = 1;
    this.nextPayoutId = 1;

    this.initDefaultSeed();
  }

  // ==========================================================================
  // SEED INITIALIZATION
  // ==========================================================================
  initDefaultSeed() {
    // 1. Users (Admin, Posters & Students with VIT domains)
    this.users = [
      {
        user_id: 1,
        name: 'Dr. Ramesh Rao (AI Research Lab)',
        email: 'ramesh.rao@vit.ac.in',
        password: 'poster123',
        role: 'POSTER',
        wallet_balance: 25000.00,
        escrow_balance: 5000.00,
        reputation_score: 180,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        user_id: 2,
        name: 'ACM VIT Student Chapter',
        email: 'acm.chapter@vit.ac.in',
        password: 'poster123',
        role: 'POSTER',
        wallet_balance: 14500.00,
        escrow_balance: 3500.00,
        reputation_score: 140,
        created_at: new Date(Date.now() - 25 * 86400000).toISOString()
      },
      {
        user_id: 3,
        name: 'Prof. Vikram Sarabhai (Dean / Admin)',
        email: 'dean.admin@vit.ac.in',
        password: 'admin123',
        role: 'ADMIN',
        wallet_balance: 60000.00,
        escrow_balance: 0.00,
        reputation_score: 250,
        created_at: new Date(Date.now() - 60 * 86400000).toISOString()
      },
      {
        user_id: 4,
        name: 'Aditi Sharma',
        email: 'aditi.sharma@vitstudent.ac.in',
        password: 'student123',
        role: 'STUDENT',
        wallet_balance: 6500.00,
        escrow_balance: 0.00,
        reputation_score: 145,
        created_at: new Date(Date.now() - 28 * 86400000).toISOString()
      },
      {
        user_id: 5,
        name: 'Rahul Verma',
        email: 'rahul.verma@vitstudent.ac.in',
        password: 'student123',
        role: 'STUDENT',
        wallet_balance: 4200.00,
        escrow_balance: 0.00,
        reputation_score: 120,
        created_at: new Date(Date.now() - 24 * 86400000).toISOString()
      },
      {
        user_id: 6,
        name: 'Sneha Patel',
        email: 'sneha.patel@vitstudent.ac.in',
        password: 'student123',
        role: 'STUDENT',
        wallet_balance: 1800.00,
        escrow_balance: 0.00,
        reputation_score: 110,
        created_at: new Date(Date.now() - 15 * 86400000).toISOString()
      },
      {
        user_id: 7,
        name: 'Karan Malhotra',
        email: 'karan.malhotra@vitstudent.ac.in',
        password: 'student123',
        role: 'STUDENT',
        wallet_balance: 500.00,
        escrow_balance: 0.00,
        reputation_score: 100,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString()
      }
    ];
    this.nextUserId = 8;

    // 2. Bounties
    this.bounties = [
      {
        bounty_id: 1,
        poster_id: 1,
        title: 'FastAPI Token Refresh & JWT Bugfix',
        description: 'Fix token expiration refresh race condition in campus AI cluster portal backend.',
        category: 'BUG_FIX',
        reward_amount: 2500.00,
        max_claimants: 1,
        deadline: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'COMPLETED',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        bounty_id: 2,
        poster_id: 2,
        title: 'Annual Hackathon Teaser Poster & Assets',
        description: 'Create high-res vector graphics and Instagram banner kit in Figma for HackFest 2026.',
        category: 'DESIGN',
        reward_amount: 1800.00,
        max_claimants: 1,
        deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
        status: 'UNDER_REVIEW',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        bounty_id: 3,
        poster_id: 3,
        title: 'PostgreSQL Sharding & Partition Benchmark',
        description: 'Write test harnesses for time-series student telemetry data using pg_partman.',
        category: 'DATABASE',
        reward_amount: 4500.00,
        max_claimants: 2,
        deadline: new Date(Date.now() + 6 * 86400000).toISOString(),
        status: 'IN_PROGRESS',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString()
      },
      {
        bounty_id: 4,
        poster_id: 1,
        title: 'Quantize LLaMA-3 LoRA Weights to GGUF',
        description: 'Optimize 8B model checkpoint to 4-bit GGUF with perplexity benchmarks on student server.',
        category: 'AI_ML',
        reward_amount: 5000.00,
        max_claimants: 1,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'OPEN',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        bounty_id: 5,
        poster_id: 2,
        title: 'Club Membership Dashboard with React & Vite',
        description: 'Implement student sign-in and RFID badge verification UI with responsive dark mode.',
        category: 'WEB_DEV',
        reward_amount: 3500.00,
        max_claimants: 2,
        deadline: new Date(Date.now() + 8 * 86400000).toISOString(),
        status: 'OPEN',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        bounty_id: 6,
        poster_id: 3,
        title: 'Draft Seed Funding Pitch Deck for EdTech Startup',
        description: 'Create an 8-slide executive pitch deck for AI teaching assistant grant proposal.',
        category: 'CONTENT',
        reward_amount: 3000.00,
        max_claimants: 1,
        deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
        status: 'OPEN',
        created_at: new Date(Date.now() - 12 * 3600000).toISOString()
      }
    ];
    this.nextBountyId = 7;

    // 3. Bounty Skills
    this.bountySkills = [
      { bounty_id: 1, skill_tag: 'Python' },
      { bounty_id: 1, skill_tag: 'FastAPI' },
      { bounty_id: 1, skill_tag: 'JWT' },
      { bounty_id: 2, skill_tag: 'Figma' },
      { bounty_id: 2, skill_tag: 'Illustrator' },
      { bounty_id: 2, skill_tag: 'Branding' },
      { bounty_id: 3, skill_tag: 'PostgreSQL' },
      { bounty_id: 3, skill_tag: 'Partitioning' },
      { bounty_id: 3, skill_tag: 'Benchmarking' },
      { bounty_id: 4, skill_tag: 'Python' },
      { bounty_id: 4, skill_tag: 'PyTorch' },
      { bounty_id: 4, skill_tag: 'LLM' },
      { bounty_id: 4, skill_tag: 'Quantization' },
      { bounty_id: 5, skill_tag: 'React' },
      { bounty_id: 5, skill_tag: 'JavaScript' },
      { bounty_id: 5, skill_tag: 'CSS' },
      { bounty_id: 5, skill_tag: 'Vite' },
      { bounty_id: 6, skill_tag: 'Pitch Deck' },
      { bounty_id: 6, skill_tag: 'Copywriting' },
      { bounty_id: 6, skill_tag: 'Financial Modeling' }
    ];

    // 4. Claims
    this.claims = [
      {
        claim_id: 1,
        bounty_id: 1,
        student_id: 4,
        claim_status: 'APPROVED',
        submission_url: 'https://github.com/campus-ai/portal-auth/pull/18',
        claimed_at: new Date(Date.now() - 9 * 86400000).toISOString(),
        submitted_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        reviewed_at: new Date(Date.now() - 6 * 86400000).toISOString()
      },
      {
        claim_id: 2,
        bounty_id: 2,
        student_id: 6,
        claim_status: 'SUBMITTED',
        submission_url: 'https://figma.com/file/hackfest-2026-design-kit',
        claimed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        submitted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        reviewed_at: null
      },
      {
        claim_id: 3,
        bounty_id: 3,
        student_id: 5,
        claim_status: 'ASSIGNED',
        submission_url: null,
        claimed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        submitted_at: null,
        reviewed_at: null
      },
      {
        claim_id: 4,
        bounty_id: 3,
        student_id: 7,
        claim_status: 'ASSIGNED',
        submission_url: null,
        claimed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        submitted_at: null,
        reviewed_at: null
      }
    ];
    this.nextClaimId = 5;

    // 5. Payout Ledger
    this.payoutLedger = [
      {
        payout_id: 1,
        claim_id: 1,
        from_user_id: 1,
        to_user_id: 4,
        amount: 2500.00,
        transaction_time: new Date(Date.now() - 6 * 86400000).toISOString()
      }
    ];
    this.nextPayoutId = 2;
  }

  // ==========================================================================
  // AUTOMATION TRIGGER: trg_sync_bounty_capacity()
  // ==========================================================================
  syncBountyCapacity(bountyId) {
    const bounty = this.bounties.find(b => b.bounty_id === bountyId);
    if (!bounty) return;

    // Only auto-adjust if bounty is active (OPEN or IN_PROGRESS)
    if (bounty.status === 'COMPLETED' || bounty.status === 'CANCELLED' || bounty.status === 'EXPIRED') {
      return;
    }

    const activeClaims = this.claims.filter(
      c => c.bounty_id === bountyId && ['ASSIGNED', 'SUBMITTED', 'APPROVED'].includes(c.claim_status)
    );

    const hasSubmitted = this.claims.some(
      c => c.bounty_id === bountyId && c.claim_status === 'SUBMITTED'
    );

    if (activeClaims.length >= bounty.max_claimants) {
      if (hasSubmitted) {
        bounty.status = 'UNDER_REVIEW';
      } else {
        bounty.status = 'IN_PROGRESS';
      }
    } else {
      // Re-open if capacity freed up
      bounty.status = 'OPEN';
    }
  }

  // ==========================================================================
  // BOUNTY OPERATIONS
  // ==========================================================================
  getBounties({ category, skill, status, search, poster_id } = {}) {
    return this.bounties
      .filter(b => {
        if (category && category !== 'ALL' && b.category !== category) return false;
        if (status && status !== 'ALL' && b.status !== status) return false;
        if (poster_id && b.poster_id !== parseInt(poster_id)) return false;
        if (search) {
          const s = search.toLowerCase();
          const matchTitle = b.title.toLowerCase().includes(s);
          const matchDesc = b.description.toLowerCase().includes(s);
          if (!matchTitle && !matchDesc) return false;
        }
        if (skill && skill !== 'ALL') {
          const hasSkill = this.bountySkills.some(
            bs => bs.bounty_id === b.bounty_id && bs.skill_tag.toLowerCase() === skill.toLowerCase()
          );
          if (!hasSkill) return false;
        }
        return true;
      })
      .map(b => this.enrichBounty(b))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getBountyById(bountyId) {
    const b = this.bounties.find(item => item.bounty_id === parseInt(bountyId));
    return b ? this.enrichBounty(b) : null;
  }

  enrichBounty(bounty) {
    const poster = this.users.find(u => u.user_id === bounty.poster_id);
    const skills = this.bountySkills
      .filter(bs => bs.bounty_id === bounty.bounty_id)
      .map(bs => bs.skill_tag);
    const claims = this.claims
      .filter(c => c.bounty_id === bounty.bounty_id)
      .map(c => {
        const student = this.users.find(u => u.user_id === c.student_id);
        return { ...c, student_name: student?.name || 'Unknown Student' };
      });

    const activeClaimCount = claims.filter(c => ['ASSIGNED', 'SUBMITTED', 'APPROVED'].includes(c.claim_status)).length;

    return {
      ...bounty,
      poster_name: poster ? poster.name : 'Unknown Poster',
      poster_email: poster ? poster.email : '',
      skills,
      claims,
      active_claim_count: activeClaimCount,
      remaining_slots: Math.max(0, bounty.max_claimants - activeClaimCount),
      is_expired: new Date(bounty.deadline) < new Date() && bounty.status !== 'COMPLETED'
    };
  }

  createBounty({ poster_id, title, description, category, reward_amount, max_claimants, deadline, skills }) {
    const poster = this.users.find(u => u.user_id === parseInt(poster_id));
    if (!poster) throw new Error('Poster not found');
    if (poster.role !== 'POSTER' && poster.role !== 'ADMIN') {
      throw new Error('Only users with POSTER or ADMIN role can create bounties');
    }

    const reward = parseFloat(reward_amount);
    const claimants = parseInt(max_claimants) || 1;
    const totalEscrowRequired = reward * claimants;

    if (isNaN(reward) || reward <= 0) throw new Error('Reward amount must be greater than 0');
    if (new Date(deadline) <= new Date()) throw new Error('Deadline must be in the future');

    // Upfront Escrow Lock: check poster balance
    if (poster.wallet_balance < totalEscrowRequired) {
      throw new Error(
        `Insufficient wallet balance for escrow lock. Required: ₹${totalEscrowRequired.toFixed(2)}, Available: ₹${poster.wallet_balance.toFixed(2)}`
      );
    }

    // Atomic Escrow Transfer: wallet -> escrow_balance
    poster.wallet_balance -= totalEscrowRequired;
    poster.escrow_balance += totalEscrowRequired;

    const newBounty = {
      bounty_id: this.nextBountyId++,
      poster_id: poster.user_id,
      title: title.trim(),
      description: description.trim(),
      category,
      reward_amount: reward,
      max_claimants: claimants,
      deadline: new Date(deadline).toISOString(),
      status: 'OPEN',
      created_at: new Date().toISOString()
    };

    this.bounties.push(newBounty);

    // Add normalized skills tags
    if (Array.isArray(skills)) {
      for (const tag of skills) {
        const cleanTag = tag.trim();
        if (cleanTag && !this.bountySkills.some(bs => bs.bounty_id === newBounty.bounty_id && bs.skill_tag.toLowerCase() === cleanTag.toLowerCase())) {
          this.bountySkills.push({ bounty_id: newBounty.bounty_id, skill_tag: cleanTag });
        }
      }
    }

    return this.enrichBounty(newBounty);
  }

  // ==========================================================================
  // CLAIMS OPERATIONS
  // ==========================================================================
  claimBounty({ bounty_id, student_id }) {
    const bId = parseInt(bounty_id);
    const sId = parseInt(student_id);

    const student = this.users.find(u => u.user_id === sId);
    if (!student) throw new Error('Student not found');
    if (student.role !== 'STUDENT') throw new Error('Only students can claim bounties');

    const bounty = this.bounties.find(b => b.bounty_id === bId);
    if (!bounty) throw new Error('Bounty not found');

    if (bounty.status !== 'OPEN') {
      throw new Error(`Cannot claim bounty in status: ${bounty.status}`);
    }

    if (new Date(bounty.deadline) <= new Date()) {
      throw new Error('This bounty has already expired');
    }

    // Check unique constraint (bounty_id, student_id)
    const existing = this.claims.find(c => c.bounty_id === bId && c.student_id === sId);
    if (existing) {
      throw new Error(`Student ${student.name} has already claimed this bounty (Status: ${existing.claim_status})`);
    }

    // Capacity Check
    const activeClaims = this.claims.filter(
      c => c.bounty_id === bId && ['ASSIGNED', 'SUBMITTED', 'APPROVED'].includes(c.claim_status)
    );
    if (activeClaims.length >= bounty.max_claimants) {
      throw new Error('Bounty has already reached maximum claimants capacity');
    }

    const newClaim = {
      claim_id: this.nextClaimId++,
      bounty_id: bId,
      student_id: sId,
      claim_status: 'ASSIGNED',
      submission_url: null,
      claimed_at: new Date().toISOString(),
      submitted_at: null,
      reviewed_at: null
    };

    this.claims.push(newClaim);

    // Fire Capacity Trigger
    this.syncBountyCapacity(bId);

    return {
      claim: newClaim,
      bounty: this.enrichBounty(bounty)
    };
  }

  submitSolution({ claim_id, student_id, submission_url }) {
    const cId = parseInt(claim_id);
    const claim = this.claims.find(c => c.claim_id === cId);
    if (!claim) throw new Error('Claim not found');

    if (claim.student_id !== parseInt(student_id)) {
      throw new Error('You can only submit for your own claim');
    }

    if (claim.claim_status !== 'ASSIGNED') {
      throw new Error(`Cannot submit solution for claim in status: ${claim.claim_status}`);
    }

    if (!submission_url || !submission_url.trim()) {
      throw new Error('Submission URL or deliverable link is required');
    }

    claim.submission_url = submission_url.trim();
    claim.submitted_at = new Date().toISOString();
    claim.claim_status = 'SUBMITTED';

    // Update bounty status to UNDER_REVIEW
    const bounty = this.bounties.find(b => b.bounty_id === claim.bounty_id);
    if (bounty && bounty.status === 'IN_PROGRESS') {
      bounty.status = 'UNDER_REVIEW';
    }

    return claim;
  }

  abandonClaim({ claim_id, user_id }) {
    const cId = parseInt(claim_id);
    const claim = this.claims.find(c => c.claim_id === cId);
    if (!claim) throw new Error('Claim not found');

    const bounty = this.bounties.find(b => b.bounty_id === claim.bounty_id);
    const requester = this.users.find(u => u.user_id === parseInt(user_id));

    if (!requester) throw new Error('User not found');
    const isStudent = claim.student_id === requester.user_id;
    const isPoster = bounty && bounty.poster_id === requester.user_id;
    const isAdmin = requester.role === 'ADMIN';

    if (!isStudent && !isPoster && !isAdmin) {
      throw new Error('Unauthorized to abandon or reject this claim');
    }

    if (claim.claim_status === 'APPROVED') {
      throw new Error('Cannot abandon an already approved and paid claim');
    }

    claim.claim_status = 'ABANDONED';

    // Penalize reputation slightly if student voluntarily abandons
    if (isStudent) {
      requester.reputation_score = Math.max(0, requester.reputation_score - 5);
    }

    // Trigger auto-sync: capacity reopens, switching bounty back to OPEN
    this.syncBountyCapacity(claim.bounty_id);

    return {
      claim,
      bounty: this.enrichBounty(bounty)
    };
  }

  // ==========================================================================
  // STORED PROCEDURE: approve_submission_and_payout(claim_id, poster_id)
  // ACID-Compliant Atomic Review & Escrow Release
  // ==========================================================================
  approveSubmissionAndPayout(claimId, posterId) {
    const cId = parseInt(claimId);
    const pId = parseInt(posterId);

    const claim = this.claims.find(c => c.claim_id === cId);
    if (!claim) throw new Error(`Claim ${cId} not found`);

    const bounty = this.bounties.find(b => b.bounty_id === claim.bounty_id);
    if (!bounty) throw new Error(`Associated bounty for claim ${cId} not found`);

    if (bounty.poster_id !== pId) {
      throw new Error(`Poster ${pId} does not own this bounty.`);
    }

    if (claim.claim_status !== 'SUBMITTED') {
      throw new Error(`Cannot approve claim in status: ${claim.claim_status}. Must be SUBMITTED.`);
    }

    const poster = this.users.find(u => u.user_id === pId);
    const student = this.users.find(u => u.user_id === claim.student_id);
    const reward = bounty.reward_amount;

    if (!poster || !student) throw new Error('Poster or Student account record missing');

    // 1. Validate Poster's Escrow / Balance
    if (poster.escrow_balance >= reward) {
      poster.escrow_balance -= reward;
    } else if (poster.wallet_balance >= reward) {
      poster.wallet_balance -= reward;
    } else {
      throw new Error(
        `Insufficient poster escrow or wallet balance (Required: ₹${reward.toFixed(2)}, Escrow: ₹${poster.escrow_balance.toFixed(2)}, Wallet: ₹${poster.wallet_balance.toFixed(2)})`
      );
    }

    // 2. Credit Student Wallet & Boost Reputation
    student.wallet_balance += reward;
    student.reputation_score += 15;

    // 3. Insert Immutable Audit Ledger Entry
    const newPayout = {
      payout_id: this.nextPayoutId++,
      claim_id: cId,
      from_user_id: pId,
      to_user_id: student.user_id,
      amount: reward,
      transaction_time: new Date().toISOString(),
      transaction_hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`.toUpperCase()
    };
    this.payoutLedger.unshift(newPayout);

    // 4. Update Claim to APPROVED
    claim.claim_status = 'APPROVED';
    claim.reviewed_at = new Date().toISOString();

    // 5. Check if all slots are completed or no pending work remains
    const claimsForBounty = this.claims.filter(c => c.bounty_id === bounty.bounty_id);
    const approvedCount = claimsForBounty.filter(c => c.claim_status === 'APPROVED').length;
    const pendingCount = claimsForBounty.filter(c => ['ASSIGNED', 'SUBMITTED'].includes(c.claim_status)).length;

    if (approvedCount >= bounty.max_claimants || pendingCount === 0) {
      bounty.status = 'COMPLETED';
    }

    return {
      success: true,
      payout: newPayout,
      student: {
        user_id: student.user_id,
        name: student.name,
        new_wallet_balance: student.wallet_balance,
        new_reputation_score: student.reputation_score
      },
      poster: {
        user_id: poster.user_id,
        name: poster.name,
        remaining_escrow: poster.escrow_balance
      },
      bounty: this.enrichBounty(bounty)
    };
  }

  // ==========================================================================
  // VIEW: view_student_leaderboard
  // ==========================================================================
  getStudentLeaderboard() {
    const students = this.users.filter(u => u.role === 'STUDENT');

    const leaderboard = students.map(student => {
      const studentClaims = this.claims.filter(c => c.student_id === student.user_id);
      const approvedClaims = studentClaims.filter(c => c.claim_status === 'APPROVED');

      const totalEarned = this.payoutLedger
        .filter(pl => pl.to_user_id === student.user_id)
        .reduce((sum, pl) => sum + pl.amount, 0);

      let avgTurnaroundHours = 0;
      if (approvedClaims.length > 0) {
        const totalDurationHours = approvedClaims.reduce((acc, c) => {
          if (c.submitted_at && c.claimed_at) {
            const diffMs = new Date(c.submitted_at) - new Date(c.claimed_at);
            return acc + diffMs / 3600000;
          }
          return acc;
        }, 0);
        avgTurnaroundHours = parseFloat((totalDurationHours / approvedClaims.length).toFixed(2));
      }

      const completionRatePct = studentClaims.length > 0
        ? parseFloat(((approvedClaims.length / studentClaims.length) * 100).toFixed(1))
        : 100.0;

      return {
        user_id: student.user_id,
        name: student.name,
        email: student.email,
        reputation_score: student.reputation_score,
        wallet_balance: student.wallet_balance,
        completed_tasks: approvedClaims.length,
        total_claims: studentClaims.length,
        completion_rate_pct: completionRatePct,
        total_earned_inr: totalEarned,
        avg_turnaround_hours: avgTurnaroundHours
      };
    });

    // DENSE_RANK() OVER (ORDER BY total_earned_inr DESC, reputation_score DESC)
    leaderboard.sort((a, b) => {
      if (b.total_earned_inr !== a.total_earned_inr) {
        return b.total_earned_inr - a.total_earned_inr;
      }
      return b.reputation_score - a.reputation_score;
    });

    let currentRank = 1;
    return leaderboard.map((entry, index) => {
      if (index > 0) {
        const prev = leaderboard[index - 1];
        if (prev.total_earned_inr !== entry.total_earned_inr || prev.reputation_score !== entry.reputation_score) {
          currentRank++;
        }
      }
      return { ...entry, rank_position: currentRank };
    });
  }

  // ==========================================================================
  // VIEW: Audit Payout Ledger
  // ==========================================================================
  getPayoutLedger() {
    return this.payoutLedger.map(pl => {
      const fromUser = this.users.find(u => u.user_id === pl.from_user_id);
      const toUser = this.users.find(u => u.user_id === pl.to_user_id);
      const claim = this.claims.find(c => c.claim_id === pl.claim_id);
      const bounty = claim ? this.bounties.find(b => b.bounty_id === claim.bounty_id) : null;

      return {
        ...pl,
        from_user_name: fromUser?.name || 'Unknown',
        from_user_role: fromUser?.role || '',
        to_user_name: toUser?.name || 'Unknown',
        to_user_role: toUser?.role || '',
        bounty_title: bounty?.title || 'Unknown Task',
        bounty_category: bounty?.category || 'GENERAL'
      };
    });
  }

  // ==========================================================================
  // ANALYTICS & MARKET INTELLIGENCE
  // ==========================================================================
  getMarketAnalytics() {
    const totalBounties = this.bounties.length;
    const activeBounties = this.bounties.filter(b => ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(b.status)).length;
    const completedBounties = this.bounties.filter(b => b.status === 'COMPLETED').length;

    const totalEscrowPool = this.users.reduce((sum, u) => sum + (u.escrow_balance || 0), 0);
    const totalPaidOut = this.payoutLedger.reduce((sum, pl) => sum + pl.amount, 0);

    // Skill distribution
    const skillCounts = {};
    this.bountySkills.forEach(bs => {
      skillCounts[bs.skill_tag] = (skillCounts[bs.skill_tag] || 0) + 1;
    });

    const topSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);

    // Category market value
    const categoryStats = {};
    this.bounties.forEach(b => {
      if (!categoryStats[b.category]) {
        categoryStats[b.category] = { category: b.category, total_value: 0, count: 0 };
      }
      categoryStats[b.category].total_value += b.reward_amount;
      categoryStats[b.category].count += 1;
    });

    return {
      total_bounties: totalBounties,
      active_bounties: activeBounties,
      completed_bounties: completedBounties,
      total_escrow_pool: totalEscrowPool,
      total_paid_out: totalPaidOut,
      top_skills: topSkills,
      category_stats: Object.values(categoryStats)
    };
  }

  // User management
  getUsers() {
    return this.users.map(u => ({
      ...u,
      active_claims: this.claims.filter(c => c.student_id === u.user_id && ['ASSIGNED', 'SUBMITTED'].includes(c.claim_status)).length,
      active_posts: this.bounties.filter(b => b.poster_id === u.user_id && ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(b.status)).length
    }));
  }

  depositFunds(userId, amount) {
    const user = this.users.find(u => u.user_id === parseInt(userId));
    if (!user) throw new Error('User not found');
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) throw new Error('Deposit amount must be positive');
    user.wallet_balance += val;
    return user;
  }

  authenticateUser(email, password) {
    if (!email || !password) throw new Error('Email and password are required');
    const user = this.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) throw new Error('Invalid email or password');
    if (user.password !== password) throw new Error('Invalid email or password');

    // Return safe user object (without password)
    const { password: _, ...safeUser } = user;
    return {
      ...safeUser,
      active_claims: this.claims.filter(c => c.student_id === user.user_id && ['ASSIGNED', 'SUBMITTED'].includes(c.claim_status)).length,
      active_posts: this.bounties.filter(b => b.poster_id === user.user_id && ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(b.status)).length
    };
  }
}

