import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { AppDataSource } from './config/database.js';
import authRoutes from './api/auth/routes.js';
import campaignRoutes from './api/campaigns/routes.js';
import rtbRoutes from './api/rtb/routes.js';
import analyticsRoutes from './api/analytics/routes.js';
import hilltopRoutes from './api/hilltop/routes.js';
import { startOptimizationScheduler } from './services/optimizer.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(process.cwd(), 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/rtb', rtbRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/hilltop', hilltopRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database initialization and server start
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully');
    startOptimizationScheduler(60);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });
