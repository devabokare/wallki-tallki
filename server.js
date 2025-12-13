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
    { id: 'acc-admin', username: 'admin@adroit.com', password: 'admin123', callsign: 'ADROIT ACTUAL', role: 'ADMIN', createdAt: new Date().toISOString() }
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

// AUTH: Login
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body;
  
  // Find account by matching username (which holds email/phone)
  const account = db.accounts.find(u => u.username === identifier && u.password === password);
  
  if (account) {
    const { password, ...safeAccount } = account;
    // In a real app, generate a JWT here. For this prototype, we return a mock token.
    res.json({ 
      token: `tk_${Math.random().toString(36).substr(2)}`,
      user: safeAccount 
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// AUTH: Register
app.post('/api/register', (req, res) => {
  const { identifier, password, callsign } = req.body;

  if (!identifier || !password || !callsign) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // 1. WHITELIST CHECK: Check if identifier (Email or Phone) is in allowedMembers
  const isAllowed = db.allowedMembers.find(member => 
    member.email === identifier || member.phone === identifier
  );

  if (!isAllowed) {
    // 403 Forbidden: User is not in the company manifest
    return res.status(403).json({ error: 'ID not found in Company Manifest' });
  }

  // 2. DUPLICATE CHECK: Check if account already exists
  if (db.accounts.find(u => u.username === identifier)) {
    return res.status(409).json({ error: 'Account already exists' });
  }

  const newAccount = {
    id: `acc-${Date.now()}`,
    username: identifier, // Store email/phone as the username
    password, // In production, hash this!
    callsign: callsign.toUpperCase(),
    role: 'OPERATOR',
    createdAt: new Date().toISOString()
  };

  db.accounts.push(newAccount);
  saveData();

  const { password: _, ...safeAccount } = newAccount;
  res.json({
    token: `tk_${Math.random().toString(36).substr(2)}`,
    user: safeAccount
  });
});

// ADMIN: Get Whitelist
app.get('/api/admin/whitelist', (req, res) => {
  // In a real app, verify admin token here
  const adminId = req.headers['x-admin-id'];
  // Simple check if provided (in real app, check DB/Token)
  if (!adminId) {
     return res.status(403).json({ error: 'Unauthorized' });
  }
  
  res.json(db.allowedMembers);
});

// ADMIN: Add to Whitelist
app.post('/api/admin/whitelist', (req, res) => {
  const { adminId, name, identifier } = req.body;
  
  // Verify Admin
  const admin = db.accounts.find(a => a.id === adminId);
  if (!admin || admin.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized: Command Clearance Required' });
  }

  // Basic Validation
  if (!name || !identifier) {
    return res.status(400).json({ error: 'Invalid Data' });
  }

  // Check existence
  const exists = db.allowedMembers.find(m => m.email === identifier || m.phone === identifier);
  if (exists) {
    return res.status(409).json({ error: 'Personnel already authorized' });
  }

  const isEmail = identifier.includes('@');
  const newMember = {
    id: `m-${Date.now()}`,
    name,
    email: isEmail ? identifier : undefined,
    phone: !isEmail ? identifier : undefined
  };

  db.allowedMembers.push(newMember);
  saveData();

  res.json({ success: true, member: newMember });
});

// Create Department
app.post('/api/departments', (req, res) => {
  const newDept = req.body;
  if (!newDept.id || !newDept.name) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  db.departments.push(newDept);
  saveData();
  res.json(newDept);
});

// Create Channel
app.post('/api/channels', (req, res) => {
  const newChannel = req.body;
  if (!newChannel.id || !newChannel.name) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  db.channels.push(newChannel);
  saveData();
  res.json(newChannel);
});

// Create User (Simulation)
app.post('/api/users', (req, res) => {
  const newUser = req.body;
  if (!newUser.id || !newUser.name) {
    return res.status(400).json({ error: 'Invalid data' });
  }
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