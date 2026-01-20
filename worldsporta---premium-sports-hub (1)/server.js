
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'db.json');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Initialize Database
async function initDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    // If db.json doesn't exist, create it with empty defaults
    const initialData = {
      news: [],
      scores: [],
      products: [],
      orders: [],
      users: [
        { id: '1', username: 'admin', email: 'admin@worldsporta.com', role: 'admin', isBlocked: false, createdAt: new Date().toISOString() }
      ]
    };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

async function readDB() {
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// API Routes
app.get('/api/news', async (req, res) => {
  const db = await readDB();
  res.json(db.news);
});

app.post('/api/news', async (req, res) => {
  const db = await readDB();
  db.news = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.get('/api/scores', async (req, res) => {
  const db = await readDB();
  res.json(db.scores);
});

app.post('/api/scores', async (req, res) => {
  const db = await readDB();
  db.scores = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.get('/api/products', async (req, res) => {
  const db = await readDB();
  res.json(db.products);
});

app.post('/api/products', async (req, res) => {
  const db = await readDB();
  db.products = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.get('/api/orders', async (req, res) => {
  const db = await readDB();
  res.json(db.orders);
});

app.post('/api/orders', async (req, res) => {
  const db = await readDB();
  db.orders.unshift(req.body);
  await writeDB(db);
  res.json({ success: true });
});

app.get('/api/users', async (req, res) => {
  const db = await readDB();
  res.json(db.users);
});

app.post('/api/users/block', async (req, res) => {
  const { userId, isBlocked } = req.body;
  const db = await readDB();
  db.users = db.users.map(u => u.id === userId ? { ...u, isBlocked } : u);
  await writeDB(db);
  res.json({ success: true });
});

app.post('/api/users/register', async (req, res) => {
  const newUser = req.body;
  const db = await readDB();
  db.users.push(newUser);
  await writeDB(db);
  res.json({ success: true });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Real Backend running at http://localhost:${PORT}`);
    console.log(`📁 Database persisted in ${DB_PATH}`);
  });
});
