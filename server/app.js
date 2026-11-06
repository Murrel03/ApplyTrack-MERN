const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');

/**
 * Builds the Express app without opening a port or connecting to Mongo,
 * so tests can import it and connect their own (in-memory) database.
 */
function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'applytrack-api' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/applications', applicationRoutes);

  app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

  // Central error handler (Mongoose validation errors -> 400).
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid id format' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  });

  return app;
}

module.exports = createApp;
