const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  ...(process.env.CLIENT_ORIGINS || '').split(',').map((v) => v.trim()).filter(Boolean),
].filter(Boolean);

sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((err) => console.error('❌ Database connection failed:', err));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const Event = require('./models/Event');
const ExamPreparation = require('./models/ExamPreparationModel');

const ExamAiChatSession = require('./models/ExamAiChatSession');

const Module = require('./models/Module');
const Grade = require('./models/Grade');
const ModuleResource = require('./models/ModuleResource');
require('./models/Assignment');
require('./models/Attendance');


Module.hasMany(ModuleResource, { foreignKey: 'moduleId', onDelete: 'CASCADE', hooks: true });
ModuleResource.belongsTo(Module, { foreignKey: 'moduleId' });

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
  const timetableRoutes = require('./routes/timetableRoutes');
  const eventRoutes = require('./routes/eventRoutes');
  const examPreparationRoutes = require('./routes/examPreparationRoutes');
  const moduleRoutes = require('./routes/moduleRoutes');
  const gradeRoutes = require('./routes/gradeRoutes');
  const moduleResourceRoutes = require('./routes/moduleResourceRoutes');
  const assignmentRoutes = require('./routes/assignmentRoutes');
  const attendanceRoutes = require('./routes/attendanceRoutes');
  console.log('✅ Routes files loaded successfully');

  app.use('/api/timetables', timetableRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/exam-preparation', examPreparationRoutes);
  app.use('/api/modules', moduleRoutes);
  app.use('/api/grades', gradeRoutes);
  app.use('/api/module-resources', moduleResourceRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/attendance', attendanceRoutes);
  console.log('✅ All routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to load routes:', error.message);
  console.error('❌ Stack trace:', error.stack);
}

app.get('/', (req, res) => {
  res.json({
    message: '🎓 Academic Planner API is running',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: '✅ API test endpoint working',
    routes: {
      timetables: '/api/timetables',
      events: '/api/events',
      examPreparation: '/api/exam-preparation',
      modules: '/api/modules',
      grades: '/api/grades',
      moduleResources: '/api/module-resources',
      assignments: '/api/assignments',
      attendance: '/api/attendance',
      test: '/api/test',

      examPreparation: '/api/exam-preparation',
      uploads: '/uploads/exam-pdfs/:file'

    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`,

    availableRoutes: ['/', '/api/test', '/api/events', '/api/exam-preparation', '/uploads/exam-pdfs/:file']

  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Attachment is too large',
      message: 'Please upload a smaller file. The current limit is 10 MB per request.'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📆 Timetables: http://localhost:${PORT}/api/timetables`);
  console.log(`📅 Events: http://localhost:${PORT}/api/events`);
  console.log(`📚 Exam preparation: http://localhost:${PORT}/api/exam-preparation`);
  console.log(`📘 Modules: http://localhost:${PORT}/api/modules`);
  console.log(`📊 Grades: http://localhost:${PORT}/api/grades`);
  console.log(`📁 Module resources: http://localhost:${PORT}/api/module-resources`);
  console.log(`📋 Assignments: http://localhost:${PORT}/api/assignments`);
  console.log(`✅ Attendance: http://localhost:${PORT}/api/attendance`);
  console.log(`💾 Database: SQLite (database.sqlite)`);
});

module.exports = app;
