import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Import routes (must be before server startup)
import authRoutes from './routes/auth.js';

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
      res.json({ status: 'ok', message: 'Server is running' });
    });

    console.log('Registering auth routes...');
    app.use('/api/auth', authRoutes);
    console.log('Auth routes registered');

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
