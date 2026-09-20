import { Router } from 'express';

export function createApiRouter(db) {
  const router = Router();

  // ==========================================================================
  // AUTHENTICATION & SESSIONS
  // ==========================================================================
  router.post('/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.authenticateUser(email, password);
      res.json({
        success: true,
        data: user,
        message: `Welcome back, ${user.name} (${user.role})`
      });
    } catch (err) {
      res.status(401).json({ success: false, error: err.message });
    }
  });

  router.get('/auth/demo-accounts', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          role: 'ADMIN',
          title: 'Campus Dean / Super Admin',
          name: 'Prof. Vikram Sarabhai',
          email: 'dean.admin@vit.ac.in',
          password: 'admin123',
          badge: 'Dean & Super Admin',
          description: 'Full platform governance: escrow treasury, audit ledger, and all campus bounties'
        },
        {
          role: 'POSTER',
          title: 'Faculty / Club Bounty Poster',
          name: 'Dr. Ramesh Rao (AI Research Lab)',
          email: 'ramesh.rao@vit.ac.in',
          password: 'poster123',
          badge: 'VIT Faculty & Bounty Poster',
          description: 'Posts campus tasks with upfront escrow locks, inspects PR deliverables, and releases payouts'
        },
        {
          role: 'STUDENT',
          title: 'VIT Student Hunter',
          name: 'Aditi Sharma',
          email: 'aditi.sharma@vitstudent.ac.in',
          password: 'student123',
          badge: 'Senior Student Hunter',
          description: 'Claims open tasks, submits code/design solutions, and earns direct wallet rewards'
        }
      ]
    });
  });

  // ==========================================================================
  // USERS & SESSIONS
  // ==========================================================================
  router.get('/users', (req, res) => {
    try {
      const users = db.getUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/users/:id/deposit', (req, res) => {
    try {
      const { amount } = req.body;
      const user = db.depositFunds(req.params.id, amount);
      res.json({ success: true, data: user, message: `Deposited ₹${parseFloat(amount).toFixed(2)} successfully` });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // BOUNTIES
  // ==========================================================================
  router.get('/bounties', (req, res) => {
    try {
      const { category, skill, status, search, poster_id } = req.query;
      const bounties = db.getBounties({ category, skill, status, search, poster_id });
      res.json({ success: true, data: bounties, total: bounties.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/bounties/:id', (req, res) => {
    try {
      const bounty = db.getBountyById(req.params.id);
      if (!bounty) return res.status(404).json({ success: false, error: 'Bounty not found' });
      res.json({ success: true, data: bounty });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/bounties', (req, res) => {
    try {
      const { poster_id, title, description, category, reward_amount, max_claimants, deadline, skills } = req.body;
      const bounty = db.createBounty({
        poster_id,
        title,
        description,
        category,
        reward_amount,
        max_claimants,
        deadline,
        skills
      });
      res.status(201).json({
        success: true,
        data: bounty,
        message: 'Bounty posted successfully with reward secured in escrow!'
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // CLAIMS & TASK LIFECYCLE
  // ==========================================================================
  router.post('/bounties/:id/claim', (req, res) => {
    try {
      const { student_id } = req.body;
      const result = db.claimBounty({
        bounty_id: req.params.id,
        student_id
      });
      res.status(201).json({
        success: true,
        data: result,
        message: 'Bounty claimed successfully! Task is now assigned to you.'
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/claims/:id/submit', (req, res) => {
    try {
      const { student_id, submission_url } = req.body;
      const claim = db.submitSolution({
        claim_id: req.params.id,
        student_id,
        submission_url
      });
      res.json({
        success: true,
        data: claim,
        message: 'Solution submitted! The poster has been notified for review.'
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/claims/:id/abandon', (req, res) => {
    try {
      const { user_id } = req.body;
      const result = db.abandonClaim({
        claim_id: req.params.id,
        user_id
      });
      res.json({
        success: true,
        data: result,
        message: 'Claim marked as abandoned. Capacity reopened for other students.'
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // STORED PROCEDURE: APPROVE & PAYOUT
  // ==========================================================================
  router.post('/claims/:id/approve', (req, res) => {
    try {
      const { poster_id } = req.body;
      const result = db.approveSubmissionAndPayout(req.params.id, poster_id);
      res.json({
        success: true,
        data: result,
        message: 'Submission approved! Escrow reward released and student credited.'
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // LEADERBOARD, LEDGER & ANALYTICS
  // ==========================================================================
  router.get('/leaderboard', (req, res) => {
    try {
      const leaderboard = db.getStudentLeaderboard();
      res.json({ success: true, data: leaderboard });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/ledger', (req, res) => {
    try {
      const ledger = db.getPayoutLedger();
      res.json({ success: true, data: ledger, total: ledger.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/analytics', (req, res) => {
    try {
      const analytics = db.getMarketAnalytics();
      res.json({ success: true, data: analytics });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset demo database to fresh seed state
  router.post('/reset', (req, res) => {
    try {
      db.initDefaultSeed();
      res.json({ success: true, message: 'Database reset to initial campus seed data' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
