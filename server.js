import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// --- DATA STORE ---
// Default data for ADROIT GROUP
const defaultData = {
  departments: [
    { id: 'dept-1', name: 'ADROIT HQ' },
    { id: 'dept-2', name: 'SECURITY OPS' },
    { id: 'dept-3', name: 'SITE MANAGEMENT' }
  ],
  channels: [
    { id: 'ch-ai', name: 'AI DISPATCH', type: 'AI_ASSISTANT', members: 1, isSecure: true, departmentId: 'dept-1' },
    { id: 'ch-1', name: 'COMMAND NET', type: 'TEAM', members: 5, isSecure: true, departmentId: 'dept-1' },
    { id: 'ch-2', name: 'PATROL ALPHA', type: 'TEAM', members: 8, isSecure: true, departmentId: 'dept-2' },
    { id: 'ch-3', name: 'PATROL BRAVO', type: 'TEAM', members: 8, isSecure: true, departmentId: 'dept-2' },
    { id: 'ch-4', name: 'FACILITIES', type: 'TEAM', members: 4, isSecure: false, departmentId: 'dept-3' },
  ],
  users: [
    { id: 'u1', name: 'Commander', isOnline: true, isTalking: false, channelId: 'ch-1' },
    { id: 'u2', name: 'Alpha Lead', isOnline: true, isTalking: false, channelId: 'ch-2' },
    { id: 'u3', name: 'Bravo Lead', isOnline: true, isTalking: false, channelId: 'ch-3' },
    { id: 'ai-1', name: 'Adroit AI', isOnline: true, isTalking: false, channelId: 'ch-ai' },
  ],
  // WHITELIST: Only these emails/phones can register
  allowedMembers: [
    { id: 'm-1', email: 'admin@adroit.com', phone: '0000', name: 'Adroit Administrator' },
    { id: 'm-2', email: 'ops@adroit.com', phone: '5550101', name: 'Operations Lead' },
    { id: 'm-3', email: 'security@adroit.com', phone: '5550102', name: 'Security Chief' }
  ],
  accounts: [
    // Default admin account for Adroit Group
    { id: 'acc-admin', username: 'admin@adroit.com', password: 'admin123', callsign: 'Adroit Admin', role: 'ADMIN', createdAt: new Date().toISOString() }
  ]
};

// In-memory state
let db = { ...defaultData };

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      
      // Ensure strictures exist if loading old DB version
      if (!loaded.accounts) loaded.accounts = defaultData.accounts;
      if (!loaded.allowedMembers) loaded.allowedMembers = defaultData.allowedMembers;
      
      db = loaded;
      console.log('📦 Database loaded from file.');
    } else {
      console.log('🆕 No database found, creating default.');
      saveData();
    }
  } catch (err) {
    console.error('Failed to load database:', err);
    db = { ...defaultData };
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

// Initialize
loadData();

// --- API ROUTES ---

// Get all initial data
app.get('/api/init', (req, res) => {
  // Return everything EXCEPT accounts and whitelist to the client for security
  const { accounts, allowedMembers, ...clientData } = db;
  res.json(clientData);
});

// OPEN JOIN (No Password)
app.post('/api/join', (req, res) => {
  const { callsign, username } = req.body;
  
  // Use callsign primarily, fallback to username (backward compat)
  const nameToUse = callsign || username;

  if (!nameToUse) return res.status(400).json({ error: 'Callsign required' });

  // Check for admin role triggers
  const upperName = nameToUse.toUpperCase();
  const role = (upperName.includes('COMMAND') || upperName.includes('ACTUAL') || upperName === 'ADMIN') 
    ? 'ADMIN' 
    : 'OPERATOR';

  const newAccount = {
    id: `acc-${Date.now()}`,
    username: nameToUse,
    password: '', // No password for guest/quick join
    callsign: nameToUse,
    role: role,
    createdAt: new Date().toISOString()
  };

  db.accounts.push(newAccount);
  
  // Add to public user list so they appear in the channel
  const activeUser = {
    id: newAccount.id,
    name: newAccount.callsign,
    isOnline: true,
    isTalking: false,
    channelId: db.channels[0]?.id || 'ch-1' 
  };
  
  // Remove existing user with same name if exists (simple session takeover)
  db.users = db.users.filter(u => u.name !== activeUser.name);
  db.users.push(activeUser);
  
  saveData();

  res.json({ user: newAccount });
});

// Legacy Login (Kept for backward compatibility if needed)
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body;
  const account = db.accounts.find(u => u.username === identifier && u.password === password);
  
  if (account) {
    const { password, ...safeAccount } = account;
    res.json({ token: `tk_${Math.random().toString(36).substr(2)}`, user: safeAccount });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Legacy Register
app.post('/api/register', (req, res) => {
  const { identifier, password, callsign } = req.body;
  // ... existing logic skipped for brevity, favoring /api/join
  res.status(501).json({ error: 'Use Quick Join' });
});

// ADMIN: Get Whitelist
app.get('/api/admin/whitelist', (req, res) => {
  const adminId = req.headers['x-admin-id'];
  if (!adminId) {
     return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json(db.allowedMembers);
});

// ADMIN: Add to Whitelist
app.post('/api/admin/whitelist', (req, res) => {
  const { adminId, name, identifier } = req.body;
  const admin = db.accounts.find(a => a.id === adminId);
  if (!admin || admin.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  // ... rest of whitelist logic
  const newMember = { id: `m-${Date.now()}`, name, email: identifier, phone: identifier };
  db.allowedMembers.push(newMember);
  saveData();
  res.json({ success: true, member: newMember });
});

// Create Department
app.post('/api/departments', (req, res) => {
  const newDept = req.body;
  db.departments.push(newDept);
  saveData();
  res.json(newDept);
});

// Create Channel
app.post('/api/channels', (req, res) => {
  const newChannel = req.body;
  db.channels.push(newChannel);
  saveData();
  res.json(newChannel);
});

// Create User
app.post('/api/users', (req, res) => {
  const newUser = req.body;
  db.users.push(newUser);
  saveData();
  res.json(newUser);
});

// Delete User
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.users = db.users.filter(u => u.id !== id);
  saveData();
  res.json({ success: true, id });
});

// --- STATIC FILE SERVING ---
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

app.get('*', (req, res) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/downloads')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 SecurePTT Backend & Host running on http://localhost:${PORT}`);
});