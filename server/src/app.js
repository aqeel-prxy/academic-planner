const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch((error) => console.error('Database connection failed:', error));

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

require('./models/Event');
require('./models/Assignment');

sequelize.sync()
  .then(() => console.log('Database synced'))
  .catch((error) => console.error('Database sync failed:', error));

const eventRoutes = require('./routes/eventRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

app.use('/api/events', eventRoutes);
app.use('/api/assignments', assignmentRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Academic Planner API is running',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test endpoint working',
    routes: {
      events: '/api/events',
      assignments: '/api/assignments',
      test: '/api/test'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`,
    availableRoutes: ['/', '/api/test', '/api/events', '/api/assignments']
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);

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
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
