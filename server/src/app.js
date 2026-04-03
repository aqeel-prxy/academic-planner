const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import models
const Event = require('./models/Event');
const ExamPreparation = require('./models/ExamPreparationModel');
const Module = require('./models/Module');
const Grade = require('./models/Grade');
const ModuleResource = require('./models/ModuleResource');

Module.hasMany(ModuleResource, { foreignKey: 'moduleId', onDelete: 'CASCADE', hooks: true });
ModuleResource.belongsTo(Module, { foreignKey: 'moduleId' });

// Sync database (creates / alters tables). ModuleResources is synced separately so it still
// gets created if a global alter fails (common on SQLite with FK constraints).
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
  } catch (err) {
    console.error('❌ Database sync failed:', err.message);
  }
  try {
    await ModuleResource.sync({ alter: true });
    console.log('✅ Module organizer table (ModuleResources) ready');
  } catch (err) {
    console.error('❌ ModuleResources sync failed:', err.message);
  }
}
syncDatabase();

console.log('🔄 Loading routes...');
try {
  const eventRoutes = require('./routes/eventRoutes');
  const examPreparationRoutes = require('./routes/examPreparationRoutes');
  const moduleRoutes = require('./routes/moduleRoutes');
  const gradeRoutes = require('./routes/gradeRoutes');
  const moduleResourceRoutes = require('./routes/moduleResourceRoutes');
  console.log('✅ Routes files loaded successfully');

  app.use('/api/events', eventRoutes);
  app.use('/api/exam-preparation', examPreparationRoutes);
  app.use('/api/modules', moduleRoutes);
  app.use('/api/grades', gradeRoutes);
  app.use('/api/module-resources', moduleResourceRoutes);
  console.log('✅ All routes mounted successfully');
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
      examPreparation: '/api/exam-preparation',
      modules: '/api/modules',
      grades: '/api/grades',
      moduleResources: '/api/module-resources',
      test: '/api/test',
      uploads: '/uploads'
    }
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`,
    availableRoutes: [
      '/',
      '/api/test',
      '/api/events',
      '/api/exam-preparation',
      '/api/modules',
      '/api/grades',
      '/api/module-resources'
    ]
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
  console.log(`📚 Exam preparation: http://localhost:${PORT}/api/exam-preparation`);
  console.log(`📘 Modules endpoint: http://localhost:${PORT}/api/modules`);
  console.log(`📊 Grades endpoint: http://localhost:${PORT}/api/grades`);
  console.log(`📁 Module resources: http://localhost:${PORT}/api/module-resources`);
  console.log(`💾 Database: SQLite (database.sqlite)`);
});

module.exports = app;
