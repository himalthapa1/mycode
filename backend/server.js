import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Import routes (must be before server startup)
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import sessionRoutes from './routes/sessions.js';

// Async server startup
(async () => {
  try {
    // Connect to database
    await connectDB();

    const app = express();

    // Middleware
    app.use(cors({
      origin: [process.env.FRONTEND_URL, 'http://localhost:5174', 'http://localhost:5175'],
      credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Routes
    app.get('/api/health', (req, res) => {
      try {
        res.json({ status: 'ok', message: 'Server is running' });
      } catch (error) {
        console.error('Health route error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    console.log('Registering auth routes...');
    app.use('/api/auth', authRoutes);
    console.log('Auth routes registered');

    console.log('Registering groups routes...');
    app.use('/api/groups', groupRoutes);
    console.log('Groups routes registered');

    console.log('Registering session routes...');
    app.use('/api/sessions', sessionRoutes);
    console.log('Session routes registered');
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          message: 'Not found',
          code: 'NOT_FOUND'
        }
      });
    });

    // Error handling middleware (will be enhanced later)
    app.use((err, req, res, next) => {
      console.error('Middleware error:', err);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'SERVER_ERROR'
        }
      });
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
