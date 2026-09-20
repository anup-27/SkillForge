// ============================================================================
// SkillForge — VIT Campus Micro-Internship & Task-Bounty Engine
// Reactive Client Controller with Dedicated Auth Gateway & Role-Tailored Views
// ============================================================================

class SkillForgeApp {
  constructor() {
    this.state = {
      currentUser: null,
      users: [],
      bounties: [],
      leaderboard: [],
      ledger: [],
      analytics: null,
      filters: {
        category: 'ALL',
        skill: 'ALL',
        status: 'ALL',
        search: ''
      },
      activeTab: 'bounties',
      selectedBountyForDetail: null
    };

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadUsers();

    // Check for saved session in localStorage
    const savedEmail = localStorage.getItem('skillforge_user_email');
    if (savedEmail && this.state.users.length > 0) {
      const found = this.state.users.find(u => u.email.toLowerCase() === savedEmail.toLowerCase());
      if (found) {
        this.setAuthenticatedUser(found);
      } else {
        this.showLoginView();
      }
    } else {
      this.showLoginView();
    }
  }

  // ==========================================================================
  // VIEW MANAGEMENT: LOGIN GATEWAY vs DASHBOARD
  // ==========================================================================
  showLoginView() {
    this.state.currentUser = null;
    localStorage.removeItem('skillforge_user_email');
    
    document.getElementById('view-login').style.display = 'flex';
    document.getElementById('view-dashboard').style.display = 'none';
  }

  showDashboardView() {
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-dashboard').style.display = 'block';

    this.updateUserUI();
    this.renderWelcomeHero();
    this.refreshAllData();
    this.populateDeadlineDefault();
  }

  setAuthenticatedUser(user) {
    this.state.currentUser = user;
    localStorage.setItem('skillforge_user_email', user.email);
    this.showDashboardView();
  }

  // ==========================================================================
  // EVENT BINDINGS
  // ==========================================================================
  bindEvents() {
    // 1-Click Role Login Buttons on Login Page
    document.querySelectorAll('.btn-arc-login').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = btn.dataset.loginEmail;
        const pass = btn.dataset.loginPass;
        this.performLogin(email, pass);
      });
    });

    // Manual Login Form
    const manualForm = document.getElementById('form-auth-manual');
    if (manualForm) {
      manualForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('manual-email').value;
        const pass = document.getElementById('manual-password').value;
        this.performLogin(email, pass);
      });
    }

    // Sign Out & Switch Role
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      this.showToast('Signed out successfully', 'success');
      this.showLoginView();
    });

    document.getElementById('btn-switch-role')?.addEventListener('click', () => {
      this.showLoginView();
    });

    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });

    // Search and Filters
    const searchInput = document.getElementById('search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.filters.search = e.target.value;
        if (btnClearSearch) btnClearSearch.style.display = e.target.value ? 'block' : 'none';
        this.renderBounties();
      });
    }

    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.state.filters.search = '';
        btnClearSearch.style.display = 'none';
        this.renderBounties();
      });
    }

    // Category Filter Chips
    const catFilters = document.getElementById('category-filters');
    if (catFilters) {
      catFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('cat-pill')) {
          document.querySelectorAll('.cat-pill').forEach(btn => btn.classList.remove('active'));
          e.target.classList.add('active');
          this.state.filters.category = e.target.dataset.category;
          this.renderBounties();
        }
      });
    }

    // Status & Skill Dropdowns
    document.getElementById('status-filter')?.addEventListener('change', (e) => {
      this.state.filters.status = e.target.value;
      this.renderBounties();
    });

    document.getElementById('skill-filter')?.addEventListener('change', (e) => {
      this.state.filters.skill = e.target.value;
      this.renderBounties();
    });

    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      this.resetFilters();
    });

    // Modals
    document.getElementById('btn-new-bounty')?.addEventListener('click', () => {
      this.openNewBountyModal();
    });

    document.getElementById('btn-open-deposit')?.addEventListener('click', () => {
      this.openModal('modal-deposit');
    });

    // Modal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeModal(btn.dataset.closeModal);
      });
    });

    // Close Modals on Backdrop Click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    // Form Submissions
    document.getElementById('form-new-bounty')?.addEventListener('submit', (e) => this.handleCreateBounty(e));
    document.getElementById('form-submit-solution')?.addEventListener('submit', (e) => this.handleSubmitSolution(e));
    document.getElementById('form-deposit')?.addEventListener('submit', (e) => this.handleDeposit(e));

    // Live Escrow Calculator
    const rewardInput = document.getElementById('bounty-reward');
    const claimantsInput = document.getElementById('bounty-max-claimants');
    const updateCalc = () => this.updateEscrowCalc();
    rewardInput?.addEventListener('input', updateCalc);
    claimantsInput?.addEventListener('input', updateCalc);

    // Quick Deposit Buttons
    document.querySelectorAll('.btn-quick-amt').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById('deposit-amount');
        if (inp) inp.value = btn.dataset.amount;
      });
    });

    // Approval Button in Review Modal
    document.getElementById('btn-confirm-approval')?.addEventListener('click', () => this.handleConfirmApproval());

    // Claim Button inside Detail Modal
    document.getElementById('btn-detail-claim')?.addEventListener('click', () => {
      if (this.state.selectedBountyForDetail) {
        this.closeModal('modal-bounty-detail');
        this.handleClaimBounty(this.state.selectedBountyForDetail.bounty_id);
      }
    });

    // Ledger Refresh
    document.getElementById('btn-refresh-ledger')?.addEventListener('click', () => this.loadLedger());
  }

  // ==========================================================================
  // AUTHENTICATION LOGIC
  // ==========================================================================
  async performLogin(email, password) {
    const errorEl = document.getElementById('manual-login-error');
    if (errorEl) errorEl.style.display = 'none';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const json = await res.json();
      if (json.success) {
        this.showToast(`Authenticated as ${json.data.name}`, 'success');
        this.setAuthenticatedUser(json.data);
      } else {
        if (errorEl) {
          errorEl.textContent = `⚠️ ${json.error || 'Invalid credentials'}`;
          errorEl.style.display = 'block';
        }
        this.showToast(json.error || 'Authentication failed', 'error');
      }
    } catch (err) {
      this.showToast('Network error during authentication', 'error');
    }
  }

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================
  async refreshAllData() {
    await Promise.all([
      this.loadBounties(),
      this.loadLeaderboard(),
      this.loadLedger(),
      this.loadAnalytics(),
      this.loadUsers()
    ]);
  }

  async loadUsers() {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        this.state.users = json.data;
        // Keep current user updated
        if (this.state.currentUser) {
          const updated = this.state.users.find(u => u.user_id === this.state.currentUser.user_id);
          if (updated) {
            this.state.currentUser = updated;
            this.updateUserUI();
          }
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }

  async loadBounties() {
    try {
      const res = await fetch('/api/bounties');
      const json = await res.json();
      if (json.success) {
        this.state.bounties = json.data;
        this.populateSkillFilter();
        this.renderBounties();
        this.renderWorkspace();
      }
    } catch (err) {
      console.error('Failed to load bounties:', err);
    }
  }

  async loadLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      const json = await res.json();
      if (json.success) {
        this.state.leaderboard = json.data;
        this.renderLeaderboard();
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  }

  async loadLedger() {
    try {
      const res = await fetch('/api/ledger');
      const json = await res.json();
      if (json.success) {
        this.state.ledger = json.data;
        this.renderLedger();
      }
    } catch (err) {
      console.error('Failed to load ledger:', err);
    }
  }

  async loadAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success) {
        this.state.analytics = json.data;
        this.renderMetrics();
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }

  // ==========================================================================
  // UI RENDERING & ROLE ADAPTATIONS
  // ==========================================================================
  updateUserUI() {
    const user = this.state.currentUser;
    if (!user) return;

    // Header Profile Card
    const avatarEl = document.getElementById('header-user-avatar');
    const nameEl = document.getElementById('header-user-name');
    const roleBadgeEl = document.getElementById('header-user-role-badge');

    if (avatarEl) {
      avatarEl.textContent = user.role === 'ADMIN' ? '🛡️' : user.role === 'POSTER' ? '🏛️' : '🎓';
    }
    if (nameEl) {
      nameEl.textContent = user.name;
    }
    if (roleBadgeEl) {
      roleBadgeEl.className = `user-role-tag ${user.role}`;
      roleBadgeEl.textContent = user.role === 'ADMIN' ? 'SUPER ADMIN' : user.role === 'POSTER' ? 'FACULTY POSTER' : 'STUDENT HUNTER';
    }

    // Role-based wallet label
    const roleLabel = document.getElementById('header-wallet-label');
    if (roleLabel) {
      roleLabel.textContent = user.role === 'ADMIN' ? 'CAMPUS TREASURY' : user.role === 'STUDENT' ? 'STUDENT WALLET' : 'POSTER ESCROW WALLET';
    }
    
    const balanceEl = document.getElementById('header-wallet-balance');
    if (balanceEl) {
      balanceEl.textContent = `₹${user.wallet_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
    
    const escrowEl = document.getElementById('header-escrow-balance');
    if (escrowEl) {
      if (user.role === 'POSTER' && user.escrow_balance > 0) {
        escrowEl.style.display = 'inline';
        escrowEl.textContent = `(Escrow: ₹${user.escrow_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`;
      } else {
        escrowEl.style.display = 'none';
      }
    }

    const repEl = document.getElementById('header-rep-score');
    if (repEl) repEl.textContent = user.reputation_score;

    // Post Bounty Button: visible for POSTER and ADMIN
    const btnPost = document.getElementById('btn-new-bounty');
    if (btnPost) {
      btnPost.style.display = (user.role === 'POSTER' || user.role === 'ADMIN') ? 'inline-flex' : 'none';
    }
  }

  renderWelcomeHero() {
    const user = this.state.currentUser;
    if (!user) return;

    const tagEl = document.getElementById('welcome-role-tag');
    const titleEl = document.getElementById('welcome-title');
    const descEl = document.getElementById('welcome-desc');
    const actionsEl = document.getElementById('welcome-hero-actions');

    if (user.role === 'STUDENT') {
      if (tagEl) tagEl.textContent = 'VIT STUDENT HUNTER';
      if (titleEl) titleEl.textContent = `Welcome back, ${user.name}! 🎓`;
      if (descEl) descEl.textContent = `Explore verified campus task bounties listed by professors and student chapters. Claim tasks within your skillset, submit solutions, and build your verifiable on-campus portfolio.`;
      if (actionsEl) {
        actionsEl.innerHTML = `
          <button class="btn btn-primary btn-glow" onclick="window.app.switchTab('bounties')">
            🎯 Explore Open Bounties
          </button>
          <button class="btn btn-secondary" onclick="window.app.switchTab('workspace')">
            📋 My Claimed Tasks
          </button>
        `;
      }
    } else if (user.role === 'POSTER') {
      if (tagEl) tagEl.textContent = 'VIT FACULTY & CLUB POSTER';
      if (titleEl) titleEl.textContent = `Faculty Portal — ${user.name} 🏛️`;
      if (descEl) descEl.textContent = `Allocate discrete research and project tasks directly to capable students. When you publish a bounty, funds are secured in escrow and only released upon your final code review.`;
      if (actionsEl) {
        actionsEl.innerHTML = `
          <button class="btn btn-primary btn-glow" onclick="window.app.openNewBountyModal()">
            ✨ + Post New Bounty
          </button>
          <button class="btn btn-secondary" onclick="window.app.switchTab('workspace')">
            🔍 Review Pending Submissions
          </button>
        `;
      }
    } else {
      // ADMIN
      if (tagEl) tagEl.textContent = 'CAMPUS DEAN & SUPER ADMIN';
      if (titleEl) titleEl.textContent = `Campus Governance — ${user.name} 🛡️`;
      if (descEl) descEl.textContent = `Full administrative governance over the VIT micro-internship marketplace. Oversee escrow allocations, resolve disputes, inspect the immutable audit ledger, and monitor student engagement.`;
      if (actionsEl) {
        actionsEl.innerHTML = `
          <button class="btn btn-primary btn-glow" onclick="window.app.openNewBountyModal()">
            ✨ + Post University Bounty
          </button>
          <button class="btn btn-secondary" onclick="window.app.switchTab('ledger')">
            📜 Inspect Payout Ledger
          </button>
        `;
      }
    }
  }

  populateSkillFilter() {
    const skillSelect = document.getElementById('skill-filter');
    if (!skillSelect) return;
    const currentVal = skillSelect.value;
    const skillsSet = new Set();

    this.state.bounties.forEach(b => {
      if (Array.isArray(b.skills)) {
        b.skills.forEach(s => skillsSet.add(s));
      }
    });

    skillSelect.innerHTML = '<option value="ALL">All Skills</option>';
    Array.from(skillsSet).sort().forEach(skill => {
      const opt = document.createElement('option');
      opt.value = skill;
      opt.textContent = skill;
      if (skill === currentVal) opt.selected = true;
      skillSelect.appendChild(opt);
    });
  }

  renderMetrics() {
    if (!this.state.analytics) return;
    const a = this.state.analytics;

    const bEl = document.getElementById('stat-active-bounties');
    const eEl = document.getElementById('stat-escrow-pool');
    const pEl = document.getElementById('stat-total-paid');

    if (bEl) bEl.textContent = a.active_bounties;
    if (eEl) eEl.textContent = `₹${a.total_escrow_pool.toLocaleString('en-IN')}`;
    if (pEl) pEl.textContent = `₹${a.total_paid_out.toLocaleString('en-IN')}`;
  }

  renderBounties() {
    const grid = document.getElementById('bounties-grid');
    const empty = document.getElementById('bounties-empty');
    if (!grid) return;

    const user = this.state.currentUser;

    // Filter logic
    const { category, skill, status, search } = this.state.filters;
    const filtered = this.state.bounties.filter(b => {
      if (category !== 'ALL' && b.category !== category) return false;
      if (status !== 'ALL' && b.status !== status) return false;
      if (skill !== 'ALL' && !b.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchDesc = b.description.toLowerCase().includes(q);
        const matchSkill = b.skills.some(s => s.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchSkill) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';
    grid.innerHTML = filtered.map(b => this.renderBountyCard(b, user)).join('');

    // Attach card action listeners
    grid.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const bountyId = parseInt(btn.dataset.bountyId);
        const claimId = parseInt(btn.dataset.claimId);
        this.handleCardAction(action, bountyId, claimId);
      });
    });

    // Clicking anywhere on card opens full detail modal
    grid.querySelectorAll('.bounty-card').forEach(card => {
      card.addEventListener('click', () => {
        const bId = parseInt(card.dataset.bountyId);
        this.openBountyDetailModal(bId);
      });
    });

    // Clicking skill chips filters by skill
    grid.querySelectorAll('.skill-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const skillName = chip.dataset.skill;
        const sSelect = document.getElementById('skill-filter');
        if (sSelect) sSelect.value = skillName;
        this.state.filters.skill = skillName;
        this.renderBounties();
      });
    });
  }

  renderBountyCard(b, user) {
    const isOwner = user && user.user_id === b.poster_id;
    const userClaim = user ? b.claims.find(c => c.student_id === user.user_id) : null;
    const isStudent = user && user.role === 'STUDENT';
    const isAdmin = user && user.role === 'ADMIN';

    // Calculate deadline human string
    const deadlineDate = new Date(b.deadline);
    const now = new Date();
    const diffMs = deadlineDate - now;
    let deadlineStr = '';
    if (diffMs < 0) {
      deadlineStr = 'Expired';
    } else {
      const days = Math.floor(diffMs / 86400000);
      const hours = Math.floor((diffMs % 86400000) / 3600000);
      deadlineStr = days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
    }

    const fillPercent = Math.min(100, Math.round((b.active_claim_count / b.max_claimants) * 100));

    // Dynamic Action Button
    let actionBtnHtml = '';
    if (b.status === 'COMPLETED') {
      actionBtnHtml = `<button class="btn btn-secondary" disabled>✓ Completed</button>`;
    } else if (isOwner || isAdmin) {
      const pendingReviews = b.claims.filter(c => c.claim_status === 'SUBMITTED');
      if (pendingReviews.length > 0) {
        actionBtnHtml = `
          <button class="btn btn-emerald btn-glow" data-action="review" data-bounty-id="${b.bounty_id}" data-claim-id="${pendingReviews[0].claim_id}">
            ⚖️ Review (${pendingReviews.length})
          </button>`;
      } else {
        actionBtnHtml = `<button class="btn btn-secondary" data-action="details" data-bounty-id="${b.bounty_id}">Details</button>`;
      }
    } else if (isStudent) {
      if (userClaim) {
        if (userClaim.claim_status === 'ASSIGNED') {
          actionBtnHtml = `
            <button class="btn btn-primary btn-glow" data-action="submit" data-bounty-id="${b.bounty_id}" data-claim-id="${userClaim.claim_id}">
              📤 Submit Solution
            </button>`;
        } else if (userClaim.claim_status === 'SUBMITTED') {
          actionBtnHtml = `<button class="btn btn-secondary" disabled>⏳ In Review</button>`;
        } else if (userClaim.claim_status === 'APPROVED') {
          actionBtnHtml = `<button class="btn btn-emerald" disabled>🎉 Paid</button>`;
        }
      } else {
        if (b.remaining_slots > 0 && b.status === 'OPEN') {
          actionBtnHtml = `
            <button class="btn btn-primary btn-glow" data-action="claim" data-bounty-id="${b.bounty_id}">
              ⚡ Claim Bounty
            </button>`;
        } else {
          actionBtnHtml = `<button class="btn btn-secondary" disabled>🔒 Full</button>`;
        }
      }
    } else {
      actionBtnHtml = `<button class="btn btn-secondary" data-action="details" data-bounty-id="${b.bounty_id}">Details</button>`;
    }

    return `
      <div class="bounty-card" data-bounty-id="${b.bounty_id}">
        <div>
          <div class="bounty-card-header">
            <span class="category-tag">${b.category}</span>
            <span class="status-badge ${b.status}">
              ● ${b.status.replace('_', ' ')}
            </span>
          </div>

          <h3 class="bounty-title">${this.escapeHtml(b.title)}</h3>
          <p class="bounty-desc">${this.escapeHtml(b.description)}</p>

          <div class="skills-list">
            ${(b.skills || []).map(s => `<span class="skill-chip" data-skill="${s}">${s}</span>`).join('')}
          </div>

          <div class="capacity-box">
            <div class="capacity-meta">
              <span>Slots: <strong>${b.active_claim_count} / ${b.max_claimants}</strong></span>
              <span>${b.remaining_slots} slot${b.remaining_slots === 1 ? '' : 's'} free</span>
            </div>
            <div class="capacity-bar">
              <div class="capacity-fill" style="width: ${fillPercent}%;"></div>
            </div>
          </div>
        </div>

        <div class="bounty-card-footer">
          <div class="reward-info">
            <span class="reward-lbl">ESCROW REWARD</span>
            <span class="reward-amt">₹${b.reward_amount.toLocaleString('en-IN')}</span>
          </div>

          <div class="deadline-pill">
            ⏰ ${deadlineStr}
          </div>

          <div>
            ${actionBtnHtml}
          </div>
        </div>
      </div>
    `;
  }

  renderWorkspace() {
    const container = document.getElementById('workspace-content');
    const badge = document.getElementById('workspace-badge');
    const user = this.state.currentUser;
    if (!container || !user) return;

    const titleEl = document.getElementById('workspace-title');
    const subtitleEl = document.getElementById('workspace-subtitle');

    if (user.role === 'STUDENT') {
      if (titleEl) titleEl.textContent = 'My Claimed Micro-Internships';
      if (subtitleEl) subtitleEl.textContent = 'Track your active bounties, submit deliverable URLs, and monitor verification reviews.';

      const myClaims = [];
      this.state.bounties.forEach(b => {
        b.claims.forEach(c => {
          if (c.student_id === user.user_id) {
            myClaims.push({ ...c, bounty: b });
          }
        });
      });

      const activeClaimsCount = myClaims.filter(c => ['ASSIGNED', 'SUBMITTED'].includes(c.claim_status)).length;
      if (badge) {
        if (activeClaimsCount > 0) {
          badge.textContent = activeClaimsCount;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }

      if (myClaims.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🎯</div>
            <h3>You have not claimed any bounties yet</h3>
            <p>Browse the Bounty Board and claim your first micro-internship!</p>
            <button class="btn btn-primary" onclick="window.app.switchTab('bounties')">Explore Bounties</button>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Category</th>
                <th>Escrow Reward</th>
                <th>Status</th>
                <th>Claimed Date</th>
                <th>Deliverable Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${myClaims.map(c => `
                <tr>
                  <td><strong>${this.escapeHtml(c.bounty.title)}</strong></td>
                  <td><span class="category-tag">${c.bounty.category}</span></td>
                  <td><strong class="text-emerald">₹${c.bounty.reward_amount.toLocaleString('en-IN')}</strong></td>
                  <td><span class="status-badge ${c.claim_status}">${c.claim_status}</span></td>
                  <td>${new Date(c.claimed_at).toLocaleDateString()}</td>
                  <td>
                    ${c.submission_url 
                      ? `<a href="${c.submission_url}" target="_blank" class="link-url">View Submission ↗</a>` 
                      : '<span class="text-muted">Pending submission</span>'}
                  </td>
                  <td>
                    ${c.claim_status === 'ASSIGNED' ? `
                      <button class="btn btn-primary" onclick="window.app.openSubmitModal(${c.claim_id}, '${this.escapeHtml(c.bounty.title)}')">
                        Submit Solution
                      </button>
                      <button class="btn btn-secondary" style="margin-left: 6px;" onclick="window.app.handleAbandonClaim(${c.claim_id})">
                        Abandon
                      </button>
                    ` : c.claim_status === 'SUBMITTED' ? `
                      <span class="text-amber" style="font-weight:700;">⏳ In Review</span>
                    ` : `
                      <span class="text-emerald" style="font-weight:700;">✓ Approved & Paid</span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      // POSTER & ADMIN WORKSPACE
      if (titleEl) titleEl.textContent = user.role === 'ADMIN' ? 'Campus Bounty Oversight' : 'My Posted Bounties & Review Queue';
      if (subtitleEl) subtitleEl.textContent = 'Review student submissions, inspect deliverables, and trigger atomic escrow release payouts.';

      const myBounties = user.role === 'ADMIN' 
        ? this.state.bounties 
        : this.state.bounties.filter(b => b.poster_id === user.user_id);

      const pendingSubmissions = [];
      myBounties.forEach(b => {
        b.claims.forEach(c => {
          if (c.claim_status === 'SUBMITTED') {
            pendingSubmissions.push({ ...c, bounty: b });
          }
        });
      });

      if (badge) {
        if (pendingSubmissions.length > 0) {
          badge.textContent = pendingSubmissions.length;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }

      container.innerHTML = `
        <div style="margin-bottom: 30px;">
          <h3 style="margin-bottom: 12px; font-family: var(--font-heading); color: #FBBF24;">
            Submissions Awaiting Review (${pendingSubmissions.length})
          </h3>
          ${pendingSubmissions.length === 0 ? `
            <p class="text-muted" style="margin-bottom: 20px;">No pending submissions waiting for review.</p>
          ` : `
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Student Hunter</th>
                    <th>Deliverable Link</th>
                    <th>Reward</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingSubmissions.map(s => `
                    <tr>
                      <td><strong>${this.escapeHtml(s.bounty.title)}</strong></td>
                      <td>${this.escapeHtml(s.student_name)}</td>
                      <td><a href="${s.submission_url}" target="_blank" class="link-url">Open Solution ↗</a></td>
                      <td><strong class="text-emerald">₹${s.bounty.reward_amount.toLocaleString('en-IN')}</strong></td>
                      <td>
                        <button class="btn btn-emerald btn-glow" onclick="window.app.openReviewModal(${s.claim_id}, '${this.escapeHtml(s.bounty.title)}', '${this.escapeHtml(s.student_name)}', '${s.submission_url}', ${s.bounty.reward_amount})">
                          Review & Payout
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="font-family: var(--font-heading);">
              ${user.role === 'ADMIN' ? 'All Campus Bounties' : 'Bounties Posted by You'} (${myBounties.length})
            </h3>
            <button class="btn btn-primary" onclick="window.app.openNewBountyModal()">+ Post New Bounty</button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Reward</th>
                  <th>Claimants / Quota</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                ${myBounties.map(b => `
                  <tr>
                    <td><strong>${this.escapeHtml(b.title)}</strong></td>
                    <td><span class="category-tag">${b.category}</span></td>
                    <td>₹${b.reward_amount.toLocaleString('en-IN')}</td>
                    <td>${b.active_claim_count} / ${b.max_claimants}</td>
                    <td><span class="status-badge ${b.status}">${b.status}</span></td>
                    <td>${new Date(b.deadline).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  renderLeaderboard() {
    const podiumEl = document.getElementById('podium-grid');
    const tbody = document.getElementById('leaderboard-tbody');
    if (!podiumEl || !tbody || !this.state.leaderboard) return;

    const top3 = this.state.leaderboard.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

    podiumEl.innerHTML = podiumOrder.map(s => {
      const crown = s.rank_position === 1 ? '👑' : s.rank_position === 2 ? '🥈' : '🥉';
      return `
        <div class="podium-card rank-${s.rank_position}">
          <div class="podium-crown">${crown}</div>
          <div class="podium-rank-badge">#${s.rank_position}</div>
          <h3 class="podium-name">${this.escapeHtml(s.name)}</h3>
          <div class="podium-earnings">₹${s.total_earned_inr.toLocaleString('en-IN')}</div>
          <div style="font-size: 12px; color: #94A3B8;">Reputation: <strong>${s.reputation_score} pts</strong></div>
          <div style="font-size: 11px; color: #6EE7B7; margin-top: 4px;">${s.completed_tasks} tasks • ${s.completion_rate_pct}% completion</div>
        </div>
      `;
    }).join('');

    tbody.innerHTML = this.state.leaderboard.map(s => `
      <tr>
        <td><strong>#${s.rank_position}</strong></td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <strong>${this.escapeHtml(s.name)}</strong>
          </div>
        </td>
        <td><span style="font-family:var(--font-mono); font-size:12px; color:#38BDF8;">${s.email}</span></td>
        <td><span class="reputation-badge">★ ${s.reputation_score}</span></td>
        <td>${s.completed_tasks}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>${s.completion_rate_pct}%</span>
            <div style="flex: 1; max-width: 50px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
              <div style="height: 100%; width: ${s.completion_rate_pct}%; background: var(--emerald); border-radius: 2px;"></div>
            </div>
          </div>
        </td>
        <td><strong class="text-emerald">₹${s.total_earned_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
        <td>${s.avg_turnaround_hours > 0 ? `${s.avg_turnaround_hours} hrs` : '--'}</td>
      </tr>
    `).join('');
  }

  renderLedger() {
    const tbody = document.getElementById('ledger-tbody');
    if (!tbody || !this.state.ledger) return;

    if (this.state.ledger.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #9CA3AF;">No payout records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.state.ledger.map(tx => `
      <tr>
        <td><span class="hash-pill">${tx.transaction_hash || `TX-${tx.payout_id}`}</span></td>
        <td><strong>${this.escapeHtml(tx.bounty_title)}</strong></td>
        <td>${this.escapeHtml(tx.from_user_name)}</td>
        <td>${this.escapeHtml(tx.to_user_name)}</td>
        <td><strong class="text-emerald">₹${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
        <td>${new Date(tx.transaction_time).toLocaleString()}</td>
        <td><span class="status-badge COMPLETED">SETTLED</span></td>
      </tr>
    `).join('');
  }

  // ==========================================================================
  // ACTION HANDLERS & MODALS
  // ==========================================================================
  switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');

    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById(`tab-${tabId}`);
    if (pane) pane.classList.add('active');

    this.state.activeTab = tabId;

    if (tabId === 'workspace') this.renderWorkspace();
    if (tabId === 'leaderboard') this.loadLeaderboard();
    if (tabId === 'ledger') this.loadLedger();
  }

  handleCardAction(action, bountyId, claimId) {
    const user = this.state.currentUser;
    const bounty = this.state.bounties.find(b => b.bounty_id === bountyId);

    if (action === 'claim') {
      if (!user || user.role !== 'STUDENT') {
        this.showToast('Please log in with a Student Hunter account to claim bounties!', 'error');
        return;
      }
      this.handleClaimBounty(bountyId);
    } else if (action === 'submit') {
      this.openSubmitModal(claimId, bounty?.title || 'Task');
    } else if (action === 'review') {
      const claim = bounty?.claims.find(c => c.claim_id === claimId);
      this.openReviewModal(claimId, bounty?.title, claim?.student_name, claim?.submission_url, bounty?.reward_amount);
    } else if (action === 'details') {
      this.openBountyDetailModal(bountyId);
    }
  }

  openBountyDetailModal(bountyId) {
    const bounty = this.state.bounties.find(b => b.bounty_id === bountyId);
    if (!bounty) return;

    this.state.selectedBountyForDetail = bounty;
    const user = this.state.currentUser;

    document.getElementById('detail-category').textContent = bounty.category;
    document.getElementById('detail-title').textContent = bounty.title;
    document.getElementById('detail-poster').textContent = `Posted by ${bounty.poster_name}`;
    document.getElementById('detail-desc').textContent = bounty.description;
    document.getElementById('detail-reward').textContent = `₹${bounty.reward_amount.toLocaleString('en-IN')}`;
    document.getElementById('detail-capacity').textContent = `${bounty.active_claim_count} / ${bounty.max_claimants} slots filled`;
    document.getElementById('detail-deadline').textContent = new Date(bounty.deadline).toLocaleString();

    const statusBadge = document.getElementById('detail-status');
    statusBadge.className = `status-badge ${bounty.status}`;
    statusBadge.textContent = bounty.status.replace('_', ' ');

    const skillsContainer = document.getElementById('detail-skills');
    skillsContainer.innerHTML = (bounty.skills || []).map(s => `<span class="skill-chip">${s}</span>`).join('');

    const claimBtn = document.getElementById('btn-detail-claim');
    if (user && user.role === 'STUDENT' && bounty.status === 'OPEN' && bounty.remaining_slots > 0) {
      const alreadyClaimed = bounty.claims.some(c => c.student_id === user.user_id);
      if (alreadyClaimed) {
        claimBtn.disabled = true;
        claimBtn.textContent = 'Already Claimed by You';
      } else {
        claimBtn.disabled = false;
        claimBtn.textContent = '⚡ Claim This Bounty';
      }
    } else {
      claimBtn.disabled = true;
      claimBtn.textContent = (user && user.role !== 'STUDENT') ? 'Student Only' : 'Claim Unavailable';
    }

    this.openModal('modal-bounty-detail');
  }

  async handleClaimBounty(bountyId) {
    const user = this.state.currentUser;
    try {
      const res = await fetch(`/api/bounties/${bountyId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.user_id })
      });
      const json = await res.json();
      if (json.success) {
        this.showToast('⚡ Bounty claimed! Task is now in your Workspace.', 'success');
        await this.refreshAllData();
      } else {
        this.showToast(json.error || 'Failed to claim bounty', 'error');
      }
    } catch (err) {
      this.showToast('Network error while claiming bounty', 'error');
    }
  }

  openSubmitModal(claimId, title) {
    document.getElementById('submit-claim-id').value = claimId;
    document.getElementById('submit-bounty-title').textContent = title;
    document.getElementById('submission-url').value = '';
    document.getElementById('submission-notes').value = '';
    this.openModal('modal-submit-solution');
  }

  async handleSubmitSolution(e) {
    e.preventDefault();
    const claimId = document.getElementById('submit-claim-id').value;
    const url = document.getElementById('submission-url').value;
    const user = this.state.currentUser;

    try {
      const res = await fetch(`/api/claims/${claimId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.user_id,
          submission_url: url
        })
      });
      const json = await res.json();
      if (json.success) {
        this.showToast('🚀 Deliverable submitted! Poster has been notified for review.', 'success');
        this.closeModal('modal-submit-solution');
        await this.refreshAllData();
      } else {
        this.showToast(json.error || 'Failed to submit deliverable', 'error');
      }
    } catch (err) {
      this.showToast('Error submitting solution', 'error');
    }
  }

  async handleAbandonClaim(claimId) {
    if (!confirm('Are you sure you want to abandon this claim? This will reopen capacity for other students.')) return;
    const user = this.state.currentUser;

    try {
      const res = await fetch(`/api/claims/${claimId}/abandon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id })
      });
      const json = await res.json();
      if (json.success) {
        this.showToast('Claim abandoned. Bounty reopened for campus.', 'success');
        await this.refreshAllData();
      } else {
        this.showToast(json.error || 'Failed to abandon claim', 'error');
      }
    } catch (err) {
      this.showToast('Network error', 'error');
    }
  }

  openReviewModal(claimId, title, studentName, submissionUrl, reward) {
    document.getElementById('review-claim-id').value = claimId;
    document.getElementById('review-bounty-title').textContent = title;
    document.getElementById('review-student-name').textContent = studentName || 'Student';
    const linkEl = document.getElementById('review-submission-link');
    linkEl.href = submissionUrl || '#';
    linkEl.textContent = submissionUrl ? `Open Deliverable ↗` : 'No URL Provided';
    document.getElementById('review-reward-amount').textContent = `₹${parseFloat(reward).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    this.openModal('modal-review-payout');
  }

  async handleConfirmApproval() {
    const claimId = document.getElementById('review-claim-id').value;
    const user = this.state.currentUser;

    try {
      const res = await fetch(`/api/claims/${claimId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poster_id: user.user_id })
      });
      const json = await res.json();
      if (json.success) {
        this.showCelebrationAnimation();
        this.showToast('🎉 Submission approved! Escrow released to student wallet.', 'success');
        this.closeModal('modal-review-payout');
        await this.refreshAllData();
      } else {
        this.showToast(json.error || 'Failed to approve submission', 'error');
      }
    } catch (err) {
      this.showToast('Network error during payout', 'error');
    }
  }

  openNewBountyModal() {
    const user = this.state.currentUser;
    if (!user || user.role === 'STUDENT') {
      this.showToast('Only Faculty and Club Posters can create bounties', 'error');
      return;
    }

    this.updateEscrowCalc();
    this.openModal('modal-new-bounty');
  }

  updateEscrowCalc() {
    const user = this.state.currentUser;
    if (!user) return;

    const reward = parseFloat(document.getElementById('bounty-reward')?.value) || 0;
    const claimants = parseInt(document.getElementById('bounty-max-claimants')?.value) || 1;
    const totalRequired = reward * claimants;

    const calcTotal = document.getElementById('calc-total-escrow');
    const calcWallet = document.getElementById('calc-poster-wallet');
    const warning = document.getElementById('calc-escrow-warning');
    const submitBtn = document.getElementById('btn-submit-bounty');

    if (calcTotal) calcTotal.textContent = `₹${totalRequired.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (calcWallet) calcWallet.textContent = `₹${user.wallet_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    if (user.wallet_balance < totalRequired) {
      if (warning) warning.style.display = 'block';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
      }
    } else {
      if (warning) warning.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
      }
    }
  }

  async handleCreateBounty(e) {
    e.preventDefault();
    const user = this.state.currentUser;

    const title = document.getElementById('bounty-title').value;
    const category = document.getElementById('bounty-category').value;
    const deadline = document.getElementById('bounty-deadline').value;
    const reward_amount = parseFloat(document.getElementById('bounty-reward').value);
    const max_claimants = parseInt(document.getElementById('bounty-max-claimants').value);
    const skillsRaw = document.getElementById('bounty-skills').value;
    const description = document.getElementById('bounty-description').value;

    const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poster_id: user.user_id,
          title,
          category,
          deadline,
          reward_amount,
          max_claimants,
          skills,
          description
        })
      });
      const json = await res.json();
      if (json.success) {
        this.showToast('✨ Bounty posted with rewards secured in Escrow!', 'success');
        this.closeModal('modal-new-bounty');
        document.getElementById('form-new-bounty')?.reset();
        await this.refreshAllData();
      } else {
        this.showToast(json.error || 'Failed to create bounty', 'error');
      }
    } catch (err) {
      this.showToast('Network error creating bounty', 'error');
    }
  }

  async handleDeposit(e) {
    e.preventDefault();
    const user = this.state.currentUser;
    const amount = document.getElementById('deposit-amount')?.value;

    try {
      const res = await fetch(`/api/users/${user.user_id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const json = await res.json();
      if (json.success) {
        this.showToast(json.message, 'success');
        this.closeModal('modal-deposit');
        await this.loadUsers();
        this.renderBounties();
      } else {
        this.showToast(json.error || 'Deposit failed', 'error');
      }
    } catch (err) {
      this.showToast('Network error depositing funds', 'error');
    }
  }

  resetFilters() {
    this.state.filters = { category: 'ALL', skill: 'ALL', status: 'ALL', search: '' };
    const sInput = document.getElementById('search-input');
    if (sInput) sInput.value = '';
    const btnClear = document.getElementById('btn-clear-search');
    if (btnClear) btnClear.style.display = 'none';

    const skillSel = document.getElementById('skill-filter');
    if (skillSel) skillSel.value = 'ALL';

    const statSel = document.getElementById('status-filter');
    if (statSel) statSel.value = 'ALL';

    document.querySelectorAll('.cat-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === 'ALL');
    });

    this.renderBounties();
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('open');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
  }

  populateDeadlineDefault() {
    const deadlineInput = document.getElementById('bounty-deadline');
    if (!deadlineInput) return;
    const d = new Date(Date.now() + 5 * 86400000);
    deadlineInput.value = d.toISOString().slice(0, 16);
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${this.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  showCelebrationAnimation() {
    const count = 60;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.style.position = 'fixed';
      p.style.left = '50%';
      p.style.top = '50%';
      p.style.width = '8px';
      p.style.height = '8px';
      p.style.borderRadius = '50%';
      p.style.backgroundColor = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E'][Math.floor(Math.random() * 5)];
      p.style.zIndex = '99999';
      p.style.pointerEvents = 'none';

      const angle = Math.random() * Math.PI * 2;
      const velocity = 100 + Math.random() * 220;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      document.body.appendChild(p);

      p.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
      ], {
        duration: 900 + Math.random() * 400,
        easing: 'cubic-bezier(0, .9, .57, 1)'
      }).onfinish = () => p.remove();
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SkillForgeApp();
});
