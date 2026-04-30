const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const {
  User, Curriculum, ExamConfig, Blueprint, PaperType,
  Discourse, SystemSettings, SharedBlueprint
} = require('./models');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// URL Normalization Middleware
app.use((req, res, next) => {
  const catchAllPath =
    req.query?.['...path'] ??
    req.query?.['[...path]'] ??
    req.query?.path ??
    req.query?.['[[...path]]'];

  if ((req.url === '/' || req.url === '' || req.url === '/api' || req.url.startsWith('/api?')) && catchAllPath) {
    const segments = Array.isArray(catchAllPath)
      ? catchAllPath
      : String(catchAllPath).split('/').filter(Boolean);

    const params = new URLSearchParams();
    Object.entries(req.query || {}).forEach(([key, value]) => {
      if (['...path', '[...path]', 'path', '[[...path]]'].includes(key)) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => params.append(key, String(entry)));
      } else if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    req.url = `/${segments.join('/')}${params.toString() ? `?${params.toString()}` : ''}`;
  } else if (req.url === '/api') {
    req.url = '/';
  } else if (req.url.startsWith('/api/')) {
    req.url = req.url.slice(4);
  }
  next();
});

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

const puppeteer = require('puppeteer');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = require('docx');

// --- Helpers ---
const isDbReady = () => mongoose.connection.readyState === 1;
const isAdminRole = (role) => String(role || '').toUpperCase() === 'ADMIN';

const serviceUnavailable = (res) =>
  res.status(503).json({ error: 'Database service is currently unavailable.' });

const getEntityId = (value) => {
  if (!value) return '';
  // If it's a Mongoose document, use toObject to get the schema fields without virtuals shadowing them
  if (value.toObject) {
    const obj = value.toObject();
    return String(obj.id || obj._id || '');
  }
  return String(value.id || value._id || '');
};

const normalizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : user;
  return {
    ...obj,
    id: String(obj.id || obj._id || '')
  };
};

const normalizeBlueprint = (blueprint) => {
  if (!blueprint) return null;
  const obj = blueprint.toObject ? blueprint.toObject() : blueprint;
  return {
    ...obj,
    id: String(obj.id || obj._id || '')
  };
};

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET || 'dev_secret_only');
    req.user = decoded;
    next();
  } catch (err) { res.status(401).json({ error: 'Invalid or expired token' }); }
};

// SSRF Protection for Puppeteer
const validateBaseUrl = (url) => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    const allowedHosts = ['localhost', '127.0.0.1', 'blueprint-pro.vercel.app']; // Add production domain
    return allowedHosts.includes(parsed.hostname);
  } catch (e) { return false; }
};

async function createBlueprintDoc(bp, curriculum) {
  return new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: [
        new Paragraph({ text: "Question Paper Design - HS", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(`Class: ${bp.classLevel}`)] }),
                new TableCell({ children: [new Paragraph(`Subject: ${bp.subject}`)] }),
              ]
            })
          ]
        })
      ],
    }],
  });
}

// 1. Auth & User Routes
app.post('/login', async (req, res) => {
  try {
    if (!isDbReady()) return serviceUnavailable(res);
    const { username, password } = req.body;
    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const userId = getEntityId(user);
    const token = jwt.sign({ id: userId, role: user.role }, JWT_SECRET || 'dev_secret_only', { expiresIn: '24h' });
    res.json({ token, user: normalizeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.route('/profile')
  .get(auth, async (req, res) => {
    try {
      const user = await User.findOne({ id: req.user.id }, { password: 0 });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(normalizeUser(user));
    } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .put(auth, async (req, res) => {
    try {
      const { password, ...updateData } = req.body;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      const user = await User.findOneAndUpdate({ id: req.user.id }, updateData, { new: true });
      res.json(normalizeUser(user));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

app.route('/users')
  .get(auth, async (req, res) => {
    try {
      const users = await User.find({}, { password: 0 });
      res.json(users.map(normalizeUser));
    } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .post(auth, async (req, res) => {
    try {
      if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin only' });
      const { users } = req.body;
      for (const u of users) {
        if (u.password && !u.password.startsWith('$2a$')) {
          u.password = await bcrypt.hash(u.password, 10);
        }
        await User.findOneAndUpdate({ id: u.id }, u, { upsert: true });
      }
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .delete(auth, async (req, res) => {
    try {
      if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin only' });
      await User.deleteOne({ id: req.query.id });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

// 2. Blueprint Routes
app.get('/blueprints/all', auth, async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin only' });
    // Optimize: Exclude large 'items' and 'massViewHeader' fields for listing
    const bps = await Blueprint.find({}, { items: 0, massViewHeader: 0 });
    res.json(bps.map(normalizeBlueprint));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/blueprints/single/:id', auth, async (req, res) => {
  try {
    const bp = await Blueprint.findOne({ id: req.params.id });
    if (!bp) return res.status(404).json({ error: 'Blueprint not found' });
    
    const isOwner = bp.ownerId === req.user.id;
    const isAdmin = isAdminRole(req.user.role);
    const isShared = await SharedBlueprint.exists({ blueprintId: bp.id, sharedWithUserId: req.user.id });

    if (!isOwner && !isAdmin && !isShared) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(normalizeBlueprint(bp));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/blueprints/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;
    
    if (userId !== req.user.id && !isAdminRole(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let bps;
    if (type === 'shared') {
      const sharedRefs = await SharedBlueprint.find({ sharedWithUserId: userId });
      const bpIds = sharedRefs.map(s => s.blueprintId);
      bps = await Blueprint.find({ id: { $in: bpIds } }, { items: 0, massViewHeader: 0 });
    } else {
      bps = await Blueprint.find({ ownerId: userId }, { items: 0, massViewHeader: 0 });
    }
    res.json(bps.map(normalizeBlueprint));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.route('/blueprints')
  .get(auth, async (req, res) => {
    try {
      const query = isAdminRole(req.user.role) ? {} : { ownerId: req.user.id };
      const bps = await Blueprint.find(query);
      res.json(bps.map(normalizeBlueprint));
    } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .post(auth, async (req, res) => {
    try {
      const isAdmin = isAdminRole(req.user.role);
      const data = { ...req.body };
      
      // Force ownerId only for non-admins
      if (!isAdmin) {
        data.ownerId = req.user.id;
      } else if (!data.ownerId) {
        // Fallback for admins if not specified
        data.ownerId = req.user.id;
      }

      if (data.id) {
        const existing = await Blueprint.findOne({ id: data.id });
        if (existing && existing.ownerId !== req.user.id && !isAdmin) {
          return res.status(403).json({ error: 'Not authorized' });
        }
      }
      const bp = await Blueprint.findOneAndUpdate({ id: data.id }, data, { upsert: true, new: true });
      res.json(normalizeBlueprint(bp));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

app.delete('/blueprints/:id', auth, async (req, res) => {
  try {
    const bp = await Blueprint.findOne({ id: req.params.id });
    if (!bp) return res.status(404).json({ error: 'Not found' });
    if (bp.ownerId !== req.user.id && !isAdminRole(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await Blueprint.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Curriculum, Config & Settings Routes
app.route('/curriculums')
  .get(async (req, res) => {
    try { res.json(await Curriculum.find()); } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .post(auth, async (req, res) => {
    try {
      if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin only' });
      const data = req.body;
      const result = await Curriculum.findOneAndUpdate(
        { classLevel: data.classLevel, subject: data.subject },
        data,
        { upsert: true, new: true }
      );
      res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

app.route('/exam-configs')
  .get(async (req, res) => {
    try { res.json(await ExamConfig.find()); } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .post(auth, async (req, res) => {
    try {
      if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin only' });
      const { configs } = req.body;
      for (const c of configs) {
        await ExamConfig.findOneAndUpdate({ id: c.id }, c, { upsert: true });
      }
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

app.route('/settings')
  .get(async (req, res) => {
    try {
      let settings = await SystemSettings.findOne();
      if (!settings) settings = await SystemSettings.create({ cognitiveProcesses: [], knowledgeLevels: [], itemFormats: [] });
      res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .post(auth, async (req, res) => {
    try {
      if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin only' });
      const settings = await SystemSettings.findOneAndUpdate({}, req.body, { upsert: true, new: true });
      res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

app.route('/paper-types')
  .get(async (req, res) => {
    try { res.json(await PaperType.find()); } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .post(auth, async (req, res) => {
    try {
      if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin only' });
      const { types } = req.body;
      for (const t of types) {
        await PaperType.findOneAndUpdate({ id: t.id }, t, { upsert: true });
      }
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

app.route('/discourses')
  .get(async (req, res) => {
    try { res.json(await Discourse.find()); } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .post(auth, async (req, res) => {
    try {
      if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin only' });
      const { discourses } = req.body;
      for (const d of discourses) {
        await Discourse.findOneAndUpdate({ id: d.id }, d, { upsert: true });
      }
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

// 4. Sharing Routes
app.post('/share', auth, async (req, res) => {
  try {
    const data = req.body;
    const result = await SharedBlueprint.findOneAndUpdate({ blueprintId: data.blueprintId, sharedWithUserId: data.sharedWithUserId }, data, { upsert: true, new: true });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/share/:blueprintId', auth, async (req, res) => {
  try {
    const shares = await SharedBlueprint.find({ blueprintId: req.params.blueprintId });
    const userIds = shares.map(s => s.sharedWithUserId);
    const users = await User.find({ id: { $in: userIds } }, { password: 0 });
    res.json(users.map(normalizeUser));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/share/:blueprintId/:userId', auth, async (req, res) => {
  try {
    await SharedBlueprint.deleteOne({ blueprintId: req.params.blueprintId, sharedWithUserId: req.params.userId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/heartbeat', auth, async (req, res) => {
  try {
    await User.findOneAndUpdate({ id: req.user.id }, { lastActive: new Date() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/live-users', auth, async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const users = await User.find({ lastActive: { $gte: fiveMinutesAgo } }, { password: 0 });
    res.json(users.map(normalizeUser));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Init Route
app.get('/init', async (req, res) => {
  try {
    if (!isDbReady()) return serviceUnavailable(res);
    const [curriculums, users, examConfigs, settings, blueprints, questionPaperTypes, discourses, sharedBlueprints] = await Promise.all([
      Curriculum.find(),
      User.find({}, { password: 0 }),
      ExamConfig.find(),
      SystemSettings.findOne().then(s => s || SystemSettings.create({ cognitiveProcesses: [], knowledgeLevels: [], itemFormats: [] })),
      Blueprint.find(),
      PaperType.find(),
      Discourse.find(),
      SharedBlueprint.find()
    ]);

    res.json({
      curriculums,
      users: users.map(normalizeUser),
      examConfigs,
      settings,
      blueprints: blueprints.map(normalizeBlueprint),
      questionPaperTypes,
      discourses,
      sharedBlueprints
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/blueprints/all', auth, async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin only' });
    const bps = await Blueprint.find();
    res.json(bps.map(normalizeBlueprint));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Export Routes (Secured)
app.post('/export/pdf', auth, async (req, res) => {
  const { id, baseUrl, tab, mode } = req.body;
  if (!validateBaseUrl(baseUrl)) return res.status(400).json({ error: 'Invalid base URL provided' });

  try {
    const bp = await Blueprint.findOne({ id });
    if (!bp) return res.status(404).json({ error: 'Blueprint not found' });
    
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Set auth token in localStorage before navigation
    // Need to be on the origin to set localStorage
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      await page.evaluate((t) => {
        localStorage.setItem('blueprint_token', t);
      }, token);
    }

    const query = new URLSearchParams({ tab: tab || 'report1', mode: mode || 'admin' });
    const printUrl = `${baseUrl}/print-view/${id}?${query.toString()}`;
    
    await page.goto(printUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.print-root', { timeout: 60000 });
    const pdf = await page.pdf({ 
      preferCSSPageSize: true,
      printBackground: false,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #000; font-family: 'Times New Roman', serif; padding-bottom: 5mm;">
          <span class="pageNumber"></span>
        </div>
      `,
      margin: {
        top: '0mm', // CSS @page handles margins
        bottom: '0mm',
        left: '0mm',
        right: '0mm'
      }
    });
    await browser.close();

    res.contentType('application/pdf');
    res.send(pdf);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. System Admin Routes
app.get('/health', (req, res) => {
  res.json({ status: isDbReady() ? 'ok' : 'error', time: new Date() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Blueprint API is running' });
});

// Cleanup: Removed insecure /reset-admin route

module.exports = app;

if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
  
  const connectToMongo = async () => {
    if (!MONGO_URI) return console.error('MONGO_URI missing');
    try {
      await mongoose.connect(MONGO_URI);
      console.log('Connected to MongoDB');
    } catch (err) { console.error('MongoDB error:', err.message); }
  };
  connectToMongo();
}
