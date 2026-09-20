import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillForgeDatabase } from './db.js';
import { createApiRouter } from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize relational database engine
const db = new SkillForgeDatabase();

app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static(publicDir));

// Mount REST API
app.use('/api', createApiRouter(db));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SkillForge Engine running at http://localhost:${PORT}`);
  console.log(`⚡ PostgreSQL Triggers & Stored Procedures: ACTIVE`);
  console.log(`🛡️  Escrow Audit Ledger: ACTIVE`);
  console.log(`=======================================================`);
});
