const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  moduleCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  moduleName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 2
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  targetGrade: {
    type: DataTypes.FLOAT,
    defaultValue: 70 // Target grade percentage
  },
  // Mid Exam Settings
  midExamWeight: {
    type: DataTypes.FLOAT,
    defaultValue: 20 // Percentage for GPA
  },
  // Quiz Settings
  numberOfQuizzes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quizWeights: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const value = this.getDataValue('quizWeights');
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return JSON.parse(value);
      return [];
    },
    set(value) {
      this.setDataValue('quizWeights', Array.isArray(value) ? value : []);
    }
  },
  // Assignment Settings
  numberOfAssignments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  assignmentWeights: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const value = this.getDataValue('assignmentWeights');
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return JSON.parse(value);
      return [];
    },
    set(value) {
      this.setDataValue('assignmentWeights', Array.isArray(value) ? value : []);
    }
  },
  // Final Exam Settings
  finalExamWeight: {
    type: DataTypes.FLOAT,
    defaultValue: 40 // Percentage for GPA
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'dropped'),
    defaultValue: 'active'
  }
}, {
  timestamps: true
});

module.exports = Module;
