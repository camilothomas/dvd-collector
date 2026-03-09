const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ titles: [] }, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

app.get('/api/titles', (req, res) => {
  res.json(readDB().titles);
});

app.post('/api/titles', (req, res) => {
  const { title, publisher } = req.body;
  if (!title || !publisher) return res.status(400).json({ error: 'title and publisher required' });
  const db = readDB();
  const entry = {
    id: crypto.randomUUID(),
    title,
    publisher,
    watched: false,
    notes: '',
    dateAdded: new Date().toISOString().split('T')[0]
  };
  db.titles.push(entry);
  writeDB(db);
  res.json(entry);
});

app.put('/api/titles/:id', (req, res) => {
  const db = readDB();
  const idx = db.titles.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.titles[idx] = { ...db.titles[idx], ...req.body, id: req.params.id };
  writeDB(db);
  res.json(db.titles[idx]);
});

app.delete('/api/titles/:id', (req, res) => {
  const db = readDB();
  db.titles = db.titles.filter(t => t.id !== req.params.id);
  writeDB(db);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`DVD Collector running at http://localhost:${PORT}`);
});
