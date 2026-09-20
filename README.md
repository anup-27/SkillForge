# SkillForge — Campus Micro-Internship & Task-Bounty Allocation Engine

SkillForge is a decentralized campus micro-internship and task-bounty allocation engine designed for campus communities, student clubs, research labs, professors, and early-stage student startups.

Instead of lengthy hiring cycles for small deliverables (e.g. debugging an API, creating an ML quantization pipeline, designing event posters, benchmarking SQL partitions), posters list discrete bounties with secured upfront escrow rewards that students claim, complete, and receive guaranteed payouts for upon code review.

---

## 1. System Architecture & ER Design

```
[ Users ] (Poster) 1 ──── N [ Bounties ] 1 ──── N [ Bounty_Skills ]
   │                              │
   │ 1                            │ 1
   ▼ N                            ▼ N
[ Payout_Ledger ] ◄──────── [ Claims ] N ──── 1 [ Users ] (Student)
```

- **One-to-Many**: A poster can post multiple bounties; a bounty tags multiple normalized skills.
- **Many-to-Many via Junction**: Students claim bounties through the `claims` table with `UNIQUE(bounty_id, student_id)`.
- **Upfront Escrow Locking**: When a bounty is created, funds transfer atomically from `wallet_balance` to `escrow_balance` to guarantee student compensation.
- **Automated Capacity Trigger**: `trg_sync_bounty_capacity` automatically flips bounty status between `OPEN` and `IN_PROGRESS` based on active claimant quotas.
- **Immutable Audit Ledger**: Every completed claim triggers `approve_submission_and_payout`, crediting student wallet, awarding reputation (+15), and appending to `payout_ledger`.

---

## 2. Pre-Configured Campus Role Accounts

The platform includes a dedicated **Authentication Gateway** with 3 distinct roles:

| Role | Entity | Official Campus Email | Password | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| 🎓 **Student Hunter** | Aditi Sharma | `aditi.sharma@vitstudent.ac.in` | `student123` | Claims open bounties, submits PR / Figma URLs, tracks review status in **My Workspace**, builds reputation & earns escrow payouts. |
| 🏛️ **Faculty Poster** | Dr. Ramesh Rao (AI Lab) | `ramesh.rao@vit.ac.in` | `poster123` | Posts campus tasks with upfront escrow locks, manages applicant capacity, reviews deliverables, and approves payouts. |
| 🛡️ **Campus Dean / Admin** | Prof. Vikram Sarabhai | `dean.admin@vit.ac.in` | `admin123` | Full governance: inspects immutable audit ledger, oversees campus escrow treasury, and resolves disputes. |

---

## 3. Project Structure

```
skillforge/
├── database/
│   ├── schema.sql         # Production PostgreSQL 14+ schema, triggers & procedures
│   └── seed.sql           # Realistic campus demo seed data
├── server/
│   ├── db.js              # Relational database engine with ACID transactions & triggers
│   ├── api.js             # REST API routes (bounties, claims, escrow, leaderboard)
│   └── server.js          # Express.js application entrypoint
├── public/
│   ├── index.html         # Single-page UI with Auth Gateway & Role Dashboards
│   ├── styles.css         # Modern dark-mode glassmorphic design system
│   └── app.js             # Client application state controller
├── test/
│   └── sanity_test.js     # 20-test automated verification suite
├── .gitignore             # Git ignore configuration
├── package.json           # Project dependencies & scripts
└── README.md              # Documentation
```

---

## 4. Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd skillforge

# Install dependencies
npm install
```

### Running the Application
```bash
npm start
```
The server will boot at:
👉 **`http://localhost:3000`**

### Running Automated Test Suite
```bash
npm test
```
Executes the sanity test suite verifying:
- Upfront escrow debiting and reservation
- Concurrency and duplicate claim prevention
- Capacity trigger state transitions (`OPEN` ↔ `IN_PROGRESS`)
- Stored procedure execution (`approve_submission_and_payout`)
- Dynamic leaderboard window ranking
- Role authentication for Student, Faculty, and Admin

---

## 5. PostgreSQL Database Automation

### Trigger: Bi-Directional Capacity Sync
```sql
CREATE TRIGGER trg_bounty_claim_sync
AFTER INSERT OR UPDATE OF claim_status OR DELETE ON claims
FOR EACH ROW
EXECUTE FUNCTION trg_sync_bounty_capacity();
```

### Stored Procedure: Atomic Escrow Release
```sql
CALL approve_submission_and_payout(p_claim_id, p_poster_id);
```

### Leaderboard View
```sql
SELECT * FROM view_student_leaderboard;
```

---

## 6. License
MIT License. Built for university campus communities and student innovators.
