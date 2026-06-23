const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');

function getDefaultData() {
  return {
    users: [
      { id: 1, name: '張小明' },
      { id: 2, name: '李小華' },
      { id: 3, name: '陳小美' }
    ],
    schedules: []
  };
}

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(getDefaultData(), null, 2));
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/users', (req, res) => {
  const data = readData();
  res.json(data.users);
});

app.post('/api/users', (req, res) => {
  const data = readData();
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const newId =
    data.users.length > 0
      ? Math.max(...data.users.map(user => user.id)) + 1
      : 1;

  const newUser = {
    id: newId,
    name
  };

  data.users.push(newUser);
  writeData(data);

  res.json(newUser);
});

app.delete('/api/users/:id', (req, res) => {
  const data = readData();
  const id = Number(req.params.id);

  data.users = data.users.filter(user => user.id !== id);
  data.schedules = data.schedules.filter(item => item.user_id !== id);

  writeData(data);

  res.json({ success: true });
});

app.get('/api/schedules', (req, res) => {
  const data = readData();
  res.json(data.schedules);
});

app.post('/api/schedules/:userId', (req, res) => {
  const data = readData();
  const userId = Number(req.params.userId);
  const { schedule } = req.body;

  data.schedules = data.schedules.filter(item => item.user_id !== userId);

  for (const day in schedule) {
    for (const period in schedule[day]) {
      data.schedules.push({
        id: Date.now() + Math.floor(Math.random() * 10000),
        user_id: userId,
        day: Number(day),
        period: Number(period),
        busy: 1
      });
    }
  }

  writeData(data);

  res.json({ success: true });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});