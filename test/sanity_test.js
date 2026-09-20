// ============================================================================
// SkillForge Database Engine Sanity Test Suite
// Verifies ACID guarantees, capacity triggers, procedures, and leaderboard
// ============================================================================

import { SkillForgeDatabase } from '../server/db.js';

function runTests() {
  console.log('🧪 Starting SkillForge Engine Sanity Tests...\n');
  const db = new SkillForgeDatabase();
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // TEST 1: Initial Seed Verification
  const bounties = db.getBounties();
  assert(bounties.length >= 6, 'Initial bounties loaded correctly');
  const students = db.getUsers().filter(u => u.role === 'STUDENT');
  assert(students.length >= 4, 'Students initialized with initial reputations and wallets');

  // TEST 2: Escrow Lock upon Bounty Creation
  const poster = db.users.find(u => u.user_id === 1);
  const initialWallet = poster.wallet_balance;
  const initialEscrow = poster.escrow_balance;
  const reward = 1000;
  const maxClaimants = 2;
  const totalRequired = reward * maxClaimants;

  const newBounty = db.createBounty({
    poster_id: 1,
    title: 'Test Sanity Bounty',
    description: 'Unit testing escrow mechanics and trigger rules',
    category: 'BUG_FIX',
    reward_amount: reward,
    max_claimants: maxClaimants,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    skills: ['NodeJS', 'PostgreSQL']
  });

  assert(
    poster.wallet_balance === initialWallet - totalRequired &&
    poster.escrow_balance === initialEscrow + totalRequired,
    'Bounty creation atomically locks funds from wallet to escrow_balance'
  );
  assert(newBounty.status === 'OPEN', 'Newly created bounty is in OPEN status');

  // TEST 3: Student Claim and Capacity Trigger
  const claimResult1 = db.claimBounty({ bounty_id: newBounty.bounty_id, student_id: 4 });
  assert(claimResult1.claim.claim_status === 'ASSIGNED', 'Claim 1 created with ASSIGNED status');
  assert(claimResult1.bounty.status === 'OPEN', 'Bounty remains OPEN when capacity not yet full (1/2)');

  // Claim 2 by another student fills capacity -> trigger should fire
  const claimResult2 = db.claimBounty({ bounty_id: newBounty.bounty_id, student_id: 5 });
  assert(claimResult2.bounty.status === 'IN_PROGRESS', 'Trigger automatically switches bounty status to IN_PROGRESS when capacity fills (2/2)');

  // TEST 4: Prevent Exceeding Capacity
  let capacityErrorCaught = false;
  try {
    db.claimBounty({ bounty_id: newBounty.bounty_id, student_id: 6 });
  } catch (err) {
    capacityErrorCaught = true;
  }
  assert(capacityErrorCaught, 'Rejects 3rd claim when max_claimants = 2');

  // TEST 5: Prevent Duplicate Claim by Same Student
  let dupErrorCaught = false;
  try {
    db.claimBounty({ bounty_id: newBounty.bounty_id, student_id: 4 });
  } catch (err) {
    dupErrorCaught = true;
  }
  assert(dupErrorCaught, 'Enforces UNIQUE (bounty_id, student_id) constraint');

  // TEST 6: Student Submits Solution
  const submissionUrl = 'https://github.com/campus/test-pr/101';
  const submittedClaim = db.submitSolution({
    claim_id: claimResult1.claim.claim_id,
    student_id: 4,
    submission_url: submissionUrl
  });
  assert(submittedClaim.claim_status === 'SUBMITTED', 'Claim transitions to SUBMITTED');

  // TEST 7: Poster Approves Submission & Stored Procedure Executes
  const student4 = db.users.find(u => u.user_id === 4);
  const studentInitialBalance = student4.wallet_balance;
  const studentInitialReputation = student4.reputation_score;
  const posterEscrowBefore = poster.escrow_balance;

  const payoutResult = db.approveSubmissionAndPayout(claimResult1.claim.claim_id, 1);
  assert(payoutResult.success === true, 'Stored procedure approve_submission_and_payout executes successfully');
  assert(student4.wallet_balance === studentInitialBalance + reward, 'Student wallet credited with reward amount');
  assert(student4.reputation_score === studentInitialReputation + 15, 'Student reputation incremented by +15');
  assert(poster.escrow_balance === posterEscrowBefore - reward, 'Poster escrow deducted by reward amount');

  // TEST 8: Immutable Payout Ledger Record
  const ledger = db.getPayoutLedger();
  const latestLedgerEntry = ledger[0];
  assert(
    latestLedgerEntry.from_user_id === 1 &&
    latestLedgerEntry.to_user_id === 4 &&
    latestLedgerEntry.amount === reward,
    'Audit payout_ledger records immutable financial transaction'
  );

  // TEST 9: Student Leaderboard Recalculation
  const leaderboard = db.getStudentLeaderboard();
  const topRank = leaderboard.find(entry => entry.user_id === 4);
  assert(topRank && topRank.rank_position === 1, 'view_student_leaderboard updates ranks dynamically');

  // TEST 10: Admin Authentication
  const adminAuth = db.authenticateUser('dean.admin@vit.ac.in', 'admin123');
  assert(adminAuth && adminAuth.role === 'ADMIN' && adminAuth.email === 'dean.admin@vit.ac.in', 'Admin user authenticates successfully (role: ADMIN)');

  // TEST 11: Poster Authentication
  const posterAuth = db.authenticateUser('ramesh.rao@vit.ac.in', 'poster123');
  assert(posterAuth && posterAuth.role === 'POSTER' && posterAuth.email === 'ramesh.rao@vit.ac.in', 'Poster user authenticates successfully (role: POSTER)');

  // TEST 12: Student Authentication
  const studentAuth = db.authenticateUser('aditi.sharma@vitstudent.ac.in', 'student123');
  assert(studentAuth && studentAuth.role === 'STUDENT' && studentAuth.email === 'aditi.sharma@vitstudent.ac.in', 'Student user authenticates successfully (role: STUDENT)');

  // TEST 13: Invalid Authentication Rejection
  let authFailed = false;
  try {
    db.authenticateUser('aditi.sharma@vitstudent.ac.in', 'wrongpassword');
  } catch (err) {
    authFailed = true;
  }
  assert(authFailed, 'Authentication rejects incorrect passwords');

  console.log(`\n=======================================================`);
  console.log(`Summary: ${passed} / ${total} tests passed!`);
  console.log(`=======================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
