const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

let dbConnectionError = '';
let dbConnectionState = 'idle';
const markConnectionError = (message) => { dbConnectionError = message; };
const clearConnectionError = () => { dbConnectionError = ''; };
const isDbReady = () => mongoose.connection.readyState === 1;
const isAdminRole = (role) => String(role || '').toLowerCase() === 'admin';
const dbUnavailableMessage = () => {
  if (!MONGO_URI) {
    return 'MongoDB connection string is not configured on the server.';
  }
  if (dbConnectionState === 'connecting') {
    return 'MongoDB connection is still initializing. Retry in a few seconds.';
  }
  return dbConnectionError || 'MongoDB is not connected. Retry after the database connection is restored.';
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let mongoConnectPromise = null;
const connectToMongo = async () => {
  if (!MONGO_URI) {
    dbConnectionState = 'error';
    markConnectionError('MongoDB connection string is not configured on the server.');
    return null;
  }
  if (isDbReady()) {
    dbConnectionState = 'connected';
    clearConnectionError();
    return mongoose.connection;
  }
  if (mongoConnectPromise) {
    return mongoConnectPromise;
  }

  dbConnectionState = 'connecting';
  mongoConnectPromise = mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  })
    .then((connection) => {
      console.log('Connected to MongoDB');
      dbConnectionState = 'connected';
      clearConnectionError();
      return connection;
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      dbConnectionState = 'error';
      markConnectionError(err.message);
      throw err;
    })
    .finally(() => {
      mongoConnectPromise = null;
    });

  return mongoConnectPromise;
};
const ensureDbReady = async () => {
  if (isDbReady()) return true;
  try {
    await Promise.race([
      connectToMongo(),
      wait(6500)
    ]);
  } catch (_) {
    // The exact failure reason is stored in dbConnectionError.
  }
  return isDbReady();
};

if (MONGO_URI) {
  connectToMongo().catch(() => {});
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err.message);
    dbConnectionState = 'error';
    markConnectionError(err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
    if (!dbConnectionError) {
      markConnectionError('MongoDB disconnected.');
    }
    if (!isDbReady()) {
      dbConnectionState = 'error';
    }
  });
} else {
  console.warn('MONGO_URI is not configured.');
  dbConnectionState = 'error';
  markConnectionError('MongoDB connection string is not configured.');
}
const getEntityId = (value) => {
  if (!value) return '';
  return String(value.id || value._id || '');
};
const idsMatch = (left, right) => {
  const a = String(left || '');
  const b = String(right || '');
  return !!a && !!b && a === b;
};
const toSafeUser = (user) => ({
  id: getEntityId(user),
  username: user.username,
  role: user.role,
  name: user.name,
  email: user.email
});
const normalizeUser = (user) => ({
  ...(user?.toObject ? user.toObject() : user),
  id: getEntityId(user)
});
const normalizeBlueprint = (blueprint) => ({
  ...(blueprint?.toObject ? blueprint.toObject() : blueprint),
  id: getEntityId(blueprint),
  ownerId: String(blueprint?.ownerId || '')
});
const normalizeShare = (share) => ({
  ...(share?.toObject ? share.toObject() : share),
  id: getEntityId(share),
  blueprintId: String(share?.blueprintId || ''),
  ownerId: String(share?.ownerId || ''),
  sharedWithUserId: String(share?.sharedWithUserId || '')
});

const serviceUnavailable = (res) =>
  res.status(503).json({ error: dbUnavailableMessage() });

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
    if (!(await ensureDbReady())) return serviceUnavailable(res);

    const [users, curriculums, examConfigs, paperTypes, discourses, settings] = await Promise.all([
      User.find(), Curriculum.find(), ExamConfig.find(), 
      PaperType.find(), Discourse.find(), SystemSettings.findOne()
    ]);

    const blueprints = await Blueprint.find();
    const sharedBlueprints = await SharedBlueprint.find();

    res.json({
      users: users.map(normalizeUser),
      curriculums,
      examConfigs,
      blueprints: blueprints.map(normalizeBlueprint),
      questionPaperTypes: paperTypes,
      discourses,
      sharedBlueprints: sharedBlueprints.map(normalizeShare),
      settings
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. POST /login - JWT Authentication
app.post('/login', async (req, res) => {
  try {
    if (!(await ensureDbReady())) return serviceUnavailable(res);

    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const storedPassword = String(user.password || '');
    const isMatch = await bcrypt.compare(password, storedPassword).catch(() => false);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const normalizedUserId = getEntityId(user);
    const token = jwt.sign({ id: normalizedUserId, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: normalizedUserId, username: user.username, role: user.role, name: user.name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. /users - User Management
app.route('/users')
  .get(auth, async (req, res) => {
    if (!(await ensureDbReady())) return serviceUnavailable(res);

    if (isAdminRole(req.user.role)) {
      return res.json((await User.find()).map(normalizeUser));
    }

    const users = await User.find({}, { id: 1, username: 1, role: 1, name: 1, email: 1, _id: 0 });
    return res.json(users.map(normalizeUser).filter((user) => !isAdminRole(user.role)));
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
    if (!(await ensureDbReady())) return serviceUnavailable(res);
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
    if (!(await ensureDbReady())) return serviceUnavailable(res);
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
    if (!(await ensureDbReady())) return serviceUnavailable(res);
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
    if (!(await ensureDbReady())) return serviceUnavailable(res);
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
    if (!(await ensureDbReady())) return serviceUnavailable(res);
    const settings = await SystemSettings.findOne();
    if (!settings) return res.status(404).json({ error: 'System settings were not found in MongoDB.' });
    res.json(settings);
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
    if (!(await ensureDbReady())) return serviceUnavailable(res);
    await Blueprint.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 10. /blueprints/:id - Blueprint Retrieval & Deletion
app.route('/blueprints/:id')
  .get(auth, async (req, res) => {
    try {
      if (!(await ensureDbReady())) return serviceUnavailable(res);

      const { type } = req.query;
      if (type === 'shared') {
        const shares = await SharedBlueprint.find({ sharedWithUserId: req.params.id });
        const shareIds = shares.map((s) => String(s.blueprintId));
        return res.json((await Blueprint.find()).map(normalizeBlueprint).filter((bp) => shareIds.includes(String(bp.id))));
      }
      if (isAdminRole(req.user.role) && req.params.id === 'all') {
        return res.json((await Blueprint.find()).map(normalizeBlueprint));
      }
      const allBlueprints = (await Blueprint.find()).map(normalizeBlueprint);
      res.json(allBlueprints.filter((bp) => idsMatch(bp.ownerId, req.params.id)));
    } catch (err) { res.status(500).json({ error: err.message }); }
  })
  .delete(auth, async (req, res) => {
    try {
      if (!(await ensureDbReady())) return serviceUnavailable(res);
      await Blueprint.deleteOne({ id: req.params.id });
      await SharedBlueprint.deleteMany({ blueprintId: req.params.id });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

// 11. /share - Sharing System
app.route(['/share', '/share/:bId', '/share/:bId/:uId'])
  .get(auth, async (req, res) => {
    if (!(await ensureDbReady())) return serviceUnavailable(res);
    const shares = await SharedBlueprint.find({ blueprintId: req.params.bId });
    const shareUserIds = shares.map((s) => String(s.sharedWithUserId));
    res.json((await User.find()).map(normalizeUser).filter((user) => shareUserIds.includes(String(user.id))));
  })
  .post(auth, async (req, res) => {
    if (!(await ensureDbReady())) return serviceUnavailable(res);
    const s = req.body;
    await SharedBlueprint.findOneAndUpdate({ blueprintId: s.blueprintId, sharedWithUserId: s.sharedWithUserId }, s, { upsert: true });
    await Blueprint.findOneAndUpdate({ id: s.blueprintId }, { $addToSet: { sharedWith: s.sharedWithUserId } });
    res.json({ success: true });
  })
  .delete(auth, async (req, res) => {
    if (!(await ensureDbReady())) return serviceUnavailable(res);
    await SharedBlueprint.deleteOne({ blueprintId: req.params.bId, sharedWithUserId: req.params.uId });
    await Blueprint.findOneAndUpdate({ id: req.params.bId }, { $pull: { sharedWith: req.params.uId } });
    res.json({ success: true });
  });

// 12. /health - System Health
app.get('/health', (req, res) => {
  const healthy = isDbReady();
  return res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'error',
    database: healthy ? 'connected' : 'disconnected',
    state: dbConnectionState,
    error: healthy ? null : dbUnavailableMessage(),
    time: new Date()
  });
});

module.exports = app;

if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Press Ctrl+C to stop the server');
  });

  server.on('error', (err) => {
    console.error('Server failed to start:', err.message);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Try using a different port.`);
    }
  });

  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server shut down.');
      process.exit(0);
    });
  });

  // Keep-alive just in case
  setInterval(() => {}, 60000);
}
