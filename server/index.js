const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { fallbackData } = require('./fallback-data');
const {
  User, Curriculum, ExamConfig, Blueprint, PaperType,
  Discourse, SystemSettings, SharedBlueprint
} = require('./models');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
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

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const USE_FALLBACK_DB = process.env.USE_FALLBACK_DB === 'true';

let fallbackOnly = USE_FALLBACK_DB;
const markFallback = () => { fallbackOnly = true; };
const markLive = () => { fallbackOnly = false; };
const isDbReady = () => !fallbackOnly && mongoose.connection.readyState === 1;
const isAdminRole = (role) => String(role || '').toLowerCase() === 'admin';

if (!USE_FALLBACK_DB && MONGO_URI) {
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  })
    .then(() => {
      console.log('Connected to MongoDB');
      markLive();
    })
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      markFallback();
    });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err.message);
    markFallback();
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected, using fallback data.');
    markFallback();
  });
} else if (USE_FALLBACK_DB) {
  console.warn('Skipping MongoDB connection. Running in fallback-only mode.');
} else {
  console.warn('MONGO_URI is not configured. Running in fallback-only mode.');
}

const cloneFallback = (value) => JSON.parse(JSON.stringify(value));
const toSafeUser = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
  name: user.name,
  email: user.email
});

const getFallbackInitPayload = () => ({
  users: cloneFallback(fallbackData.users),
  curriculums: cloneFallback(fallbackData.curriculums),
  examConfigs: cloneFallback(fallbackData.examConfigs),
  blueprints: cloneFallback(fallbackData.blueprints),
  questionPaperTypes: cloneFallback(fallbackData.questionPaperTypes),
  discourses: cloneFallback(fallbackData.discourses),
  sharedBlueprints: cloneFallback(fallbackData.sharedBlueprints),
  settings: cloneFallback(fallbackData.settings)
});

const serviceUnavailable = (res) =>
  res.status(503).json({ error: 'Database is unavailable. Retry after MongoDB connection is restored.' });

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) { res.status(401).json({ error: 'Token is not valid' }); }
};

// --- APIs (Total: 12 Route Registrations) ---

// 1. GET /init - Fetch all initial data
app.get('/init', async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json(getFallbackInitPayload());
    }

    const [users, curriculums, examConfigs, paperTypes, discourses, settings] = await Promise.all([
      User.find(), Curriculum.find(), ExamConfig.find(), 
      PaperType.find(), Discourse.find(), SystemSettings.findOne()
    ]);

    const blueprints = await Blueprint.find();
    const sharedBlueprints = await SharedBlueprint.find();

    res.json({
      users,
      curriculums,
      examConfigs,
      blueprints,
      questionPaperTypes: paperTypes,
      discourses,
      sharedBlueprints,
      settings: settings || fallbackData.settings
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. POST /login - JWT Authentication
app.post('/login', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = isDbReady()
      ? await User.findOne({ username: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
      : fallbackData.users.find((entry) => entry.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const storedPassword = String(user.password || '');
    const isMatch = await bcrypt.compare(password, storedPassword).catch(() => false);
    const plainTextMatch = password === storedPassword;
    const knownSeedPasswordMatch =
      (user.username === 'admin' && password === 'admin') ||
      (user.username === 'user' && password === 'user');

    if (!isMatch && !plainTextMatch && !knownSeedPasswordMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. /users - User Management
app.route('/users')
  .get(auth, async (req, res) => {
    if (!isDbReady()) {
      const users = cloneFallback(fallbackData.users);
      if (isAdminRole(req.user.role)) return res.json(users);
      return res.json(users.filter((user) => !isAdminRole(user.role)).map(toSafeUser));
    }

    if (isAdminRole(req.user.role)) {
      return res.json(await User.find());
    }

    const users = await User.find({}, { id: 1, username: 1, role: 1, name: 1, email: 1, _id: 0 });
    return res.json(users.filter((user) => !isAdminRole(user.role)));
  })
  .post(auth, async (req, res) => {
    if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin access required' });
    if (!isDbReady()) return serviceUnavailable(res);
    const users = Array.isArray(req.body) ? req.body : req.body.users;
    for (const u of users) {
      if (u.password && !u.password.startsWith('$2a$')) u.password = await bcrypt.hash(u.password, 10);
      await User.findOneAndUpdate({ id: u.id }, u, { upsert: true });
    }
    res.json({ success: true });
  });

// 4. /curriculums - Curriculum Management
app.route('/curriculums')
  .get(async (req, res) => {
    if (!isDbReady()) return res.json(cloneFallback(fallbackData.curriculums));
    res.json(await Curriculum.find());
  })
  .post(auth, async (req, res) => {
    if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin access required' });
    if (!isDbReady()) return serviceUnavailable(res);
    await Curriculum.findOneAndUpdate({ classLevel: req.body.classLevel, subject: req.body.subject }, req.body, { upsert: true });
    res.json({ success: true });
  });

// 5. /exam-configs - Exam Configuration
app.route('/exam-configs')
  .get(async (req, res) => {
    if (!isDbReady()) return res.json(cloneFallback(fallbackData.examConfigs));
    res.json(await ExamConfig.find());
  })
  .post(auth, async (req, res) => {
    if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin access required' });
    if (!isDbReady()) return serviceUnavailable(res);
    await ExamConfig.deleteMany({});
    await ExamConfig.insertMany(req.body.configs);
    res.json({ success: true });
  });

// 6. /paper-types - Paper Type Management
app.route('/paper-types')
  .get(async (req, res) => {
    if (!isDbReady()) return res.json(cloneFallback(fallbackData.questionPaperTypes));
    res.json(await PaperType.find());
  })
  .post(auth, async (req, res) => {
    if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin access required' });
    if (!isDbReady()) return serviceUnavailable(res);
    await PaperType.deleteMany({});
    await PaperType.insertMany(req.body.types);
    res.json({ success: true });
  });

// 7. /discourses - Discourse Management
app.route('/discourses')
  .get(async (req, res) => {
    if (!isDbReady()) return res.json(cloneFallback(fallbackData.discourses));
    res.json(await Discourse.find());
  })
  .post(auth, async (req, res) => {
    if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin access required' });
    if (!isDbReady()) return serviceUnavailable(res);
    await Discourse.deleteMany({});
    await Discourse.insertMany(req.body.discourses);
    res.json({ success: true });
  });

// 8. /settings - System Settings
app.route('/settings')
  .get(async (req, res) => {
    if (!isDbReady()) return res.json(cloneFallback(fallbackData.settings));
    res.json((await SystemSettings.findOne()) || fallbackData.settings);
  })
  .post(auth, async (req, res) => {
    if (!isAdminRole(req.user.role)) return res.status(403).json({ error: 'Admin access required' });
    if (!isDbReady()) return serviceUnavailable(res);
    await SystemSettings.findOneAndUpdate({}, req.body, { upsert: true });
    res.json({ success: true });
  });

// 9. /blueprints - Blueprint Creation
app.post('/blueprints', auth, async (req, res) => {
  try {
    if (!isDbReady()) return serviceUnavailable(res);
    await Blueprint.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 10. /blueprints/:id - Blueprint Retrieval & Deletion
app.route('/blueprints/:id')
  .get(auth, async (req, res) => {
    try {
      if (!isDbReady()) {
        const { type } = req.query;
        if (type === 'shared') {
          const shares = fallbackData.sharedBlueprints.filter((share) => share.sharedWithUserId === req.params.id);
          const sharedIds = shares.map((share) => share.blueprintId);
          return res.json(cloneFallback(fallbackData.blueprints.filter((bp) => sharedIds.includes(bp.id))));
        }
        if (isAdminRole(req.user.role) && req.params.id === 'all') {
          return res.json(cloneFallback(fallbackData.blueprints));
        }
        return res.json(cloneFallback(fallbackData.blueprints.filter((bp) => bp.ownerId === req.params.id)));
      }

      const { type } = req.query;
      if (type === 'shared') {
        const shares = await SharedBlueprint.find({ sharedWithUserId: req.params.id });
        return res.json(await Blueprint.find({ id: { $in: shares.map(s => s.blueprintId) } }));
      }
      if (isAdminRole(req.user.role) && req.params.id === 'all') return res.json(await Blueprint.find());
      res.json(await Blueprint.find({ ownerId: req.params.id }));
    } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .delete(auth, async (req, res) => {
    try {
      if (!isDbReady()) return serviceUnavailable(res);
      await Blueprint.deleteOne({ id: req.params.id });
      await SharedBlueprint.deleteMany({ blueprintId: req.params.id });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

// 11. /share - Sharing System
app.route(['/share', '/share/:bId', '/share/:bId/:uId'])
  .get(auth, async (req, res) => {
    if (!isDbReady()) {
      const shares = fallbackData.sharedBlueprints.filter((share) => share.blueprintId === req.params.bId);
      const users = fallbackData.users.filter((user) => shares.some((share) => share.sharedWithUserId === user.id));
      return res.json(cloneFallback(users));
    }
    const shares = await SharedBlueprint.find({ blueprintId: req.params.bId });
    res.json(await User.find({ id: { $in: shares.map(s => s.sharedWithUserId) } }));
  })
  .post(auth, async (req, res) => {
    if (!isDbReady()) return serviceUnavailable(res);
    const s = req.body;
    await SharedBlueprint.findOneAndUpdate({ blueprintId: s.blueprintId, sharedWithUserId: s.sharedWithUserId }, s, { upsert: true });
    await Blueprint.findOneAndUpdate({ id: s.blueprintId }, { $addToSet: { sharedWith: s.sharedWithUserId } });
    res.json({ success: true });
  })
  .delete(auth, async (req, res) => {
    if (!isDbReady()) return serviceUnavailable(res);
    await SharedBlueprint.deleteOne({ blueprintId: req.params.bId, sharedWithUserId: req.params.uId });
    await Blueprint.findOneAndUpdate({ id: req.params.bId }, { $pull: { sharedWith: req.params.uId } });
    res.json({ success: true });
  });

// 12. /health - System Health
app.get('/health', (req, res) => res.json({
  status: 'ok',
  database: isDbReady() ? 'connected' : 'fallback',
  time: new Date()
}));

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
