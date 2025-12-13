import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// --- IN-MEMORY DATA STORE (Backend Database) ---
// In a real production app, this would be a database like MongoDB or PostgreSQL.

const departments = [
  { id: 'dept-1', name: 'COMMAND H.Q.' },
  { id: 'dept-2', name: 'FIELD OPS' },
  { id: 'dept-3', name: 'SUPPORT' }
];

const channels = [
  { id: 'ch-ai', name: 'AI TACTICAL', type: 'AI_ASSISTANT', members: 1, isSecure: true, departmentId: 'dept-1' },
  { id: 'ch-1', name: 'ALPHA SQUAD', type: 'TEAM', members: 12, isSecure: true, departmentId: 'dept-2' },
  { id: 'ch-2', name: 'BRAVO SQUAD', type: 'TEAM', members: 8, isSecure: true, departmentId: 'dept-2' },
  { id: 'ch-3', name: 'LOGISTICS', type: 'TEAM', members: 4, isSecure: false, departmentId: 'dept-3' },
  { id: 'ch-4', name: 'MAINTENANCE', type: 'TEAM', members: 6, isSecure: false, departmentId: 'dept-3' },
];

let users = [
  { id: 'u1', name: 'Alpha Lead', isOnline: true, isTalking: false, channelId: 'ch-1' },
  { id: 'u2', name: 'Operator 2', isOnline: true, isTalking: false, channelId: 'ch-1' },
  { id: 'u3', name: 'Operator 3', isOnline: true, isTalking: false, channelId: 'ch-1' },
  { id: 'u6', name: 'Sec Lead', isOnline: true, isTalking: false, channelId: 'ch-2' },
  { id: 'u7', name: 'Gate 1', isOnline: true, isTalking: false, channelId: 'ch-2' },
  { id: 'u9', name: 'Dispatch', isOnline: true, isTalking: false, channelId: 'ch-3' },
  { id: 'u12', name: 'Whse Mgr', isOnline: true, isTalking: false, channelId: 'ch-3' },
  { id: 'ai-1', name: 'AI Command', isOnline: true, isTalking: false, channelId: 'ch-ai' },
];

// --- API ROUTES ---

// Get all initial data
app.get('/api/init', (req, res) => {
  res.json({
    departments,
    channels,
    users
  });
});

// Create Department
app.post('/api/departments', (req, res) => {
  const newDept = req.body;
  if (!newDept.id || !newDept.name) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  departments.push(newDept);
  res.json(newDept);
});

// Create Channel
app.post('/api/channels', (req, res) => {
  const newChannel = req.body;
  if (!newChannel.id || !newChannel.name) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  channels.push(newChannel);
  res.json(newChannel);
});

// Create User
app.post('/api/users', (req, res) => {
  const newUser = req.body;
  if (!newUser.id || !newUser.name) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  users.push(newUser);
  res.json(newUser);
});

// Delete User
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  users = users.filter(u => u.id !== id);
  res.json({ success: true, id });
});

// --- STATIC FILE SERVING ---

// Serve static files from the build directory (Dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing: return index.html for any unknown route NOT starting with /api
app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 SecurePTT Backend & Host running on http://localhost:${PORT}`);
  console.log(`   - API Endpoint: http://localhost:${PORT}/api/init`);
  console.log(`   - Serving: /dist folder`);
});
