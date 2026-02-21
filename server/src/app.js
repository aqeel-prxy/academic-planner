const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Test database connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err));

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Import model
const Event = require('./models/Event');

// Sync database (creates tables if they don't exist)
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Database synced'))
  .catch(err => console.error('❌ Database sync failed:', err));

// Debug - check if routes file exists and loads properly
console.log('🔄 Loading routes...');
try {
  const eventRoutes = require('./routes/eventRoutes');
  console.log('✅ Routes file loaded successfully');
  console.log('📋 Routes object type:', typeof eventRoutes);
  console.log('📋 Is router function:', typeof eventRoutes === 'function');
  
  // Use the routes
  app.use('/api/events', eventRoutes);
  console.log('✅ Routes mounted at /api/events');
} catch (error) {
  console.error('❌ Failed to load routes:', error.message);
  console.error('❌ Stack trace:', error.stack);
}

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '🎓 Academic Planner API is running',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ API test endpoint working',
    routes: {
      events: '/api/events',
      test: '/api/test'
    }
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`,
    availableRoutes: ['/', '/api/test', '/api/events']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📅 Events endpoint: http://localhost:${PORT}/api/events`);
  console.log(`💾 Database: SQLite (database.sqlite)`);
});

module.exports = app;