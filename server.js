
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./database');

const { router: authRouter } = require('./routes/auth');
const videoRouter = require('./routes/videos');
const uploadRouter = require('./routes/upload');
const notesRouter = require('./routes/notes');
const settingsRouter = require('./routes/settings');
const subjectsRouter = require('./routes/subjects');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes FIRST (before static)
app.use('/api/auth', authRouter);
app.use('/api/videos', videoRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/notes', notesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/subjects', subjectsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StudyStorage',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server only after MongoDB is connected
async function startServer() {
  try {
    await db.ready;

    const server = app.listen(config.PORT, '0.0.0.0', () => {
      console.log('=======================================================');
      console.log('🎓 StudyStorage - Personal Video Cloud Platform');
      console.log(`⚡ Running at: http://localhost:${config.PORT}`);
      console.log('📱 Works on Laptop, Tablet, and Mobile across your network');
      console.log('=======================================================');
    });

    server.on('error', (error) => {
      console.error('[SERVER] Failed to start:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('[STARTUP] StudyStorage could not start safely.');
    console.error('[STARTUP] MongoDB connection/data loading failed:', error);
    process.exit(1);
  }
}

startServer();
