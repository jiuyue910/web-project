const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      day INTEGER,
      period INTEGER,
      busy INTEGER
    )
  `);

  db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
    if (err) {
      console.error(err.message);
      return;
    }

    if (row.count === 0) {
      db.run(`INSERT INTO users (name) VALUES ('張小明'), ('李小華'), ('陳小美')`);
    }
  });
});

app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { name } = req.body;

  db.run('INSERT INTO users (name) VALUES (?)', [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
});

app.delete('/api/users/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM schedules WHERE user_id = ?', [id], () => {
    db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

app.get('/api/schedules', (req, res) => {
  db.all('SELECT * FROM schedules', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/schedules/:userId', (req, res) => {
  const userId = req.params.userId;
  const { schedule } = req.body;

  db.run('DELETE FROM schedules WHERE user_id = ?', [userId], () => {
    const stmt = db.prepare(
      'INSERT INTO schedules (user_id, day, period, busy) VALUES (?, ?, ?, ?)'
    );

    for (const day in schedule) {
      for (const period in schedule[day]) {
        stmt.run(userId, day, period, 1);
      }
    }

    stmt.finalize();
    res.json({ success: true });
  });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});