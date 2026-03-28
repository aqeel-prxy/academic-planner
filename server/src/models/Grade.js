const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Module = require('./Module');

const Grade = sequelize.define('Grade', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  midExamMarks: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  // Individual quiz marks stored as JSON array
  quizMarksArray: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  // Average quiz marks calculated field
  quizMarksAverage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  // Individual assignment marks stored as JSON array
  assignmentMarksArray: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  // Average assignment marks calculated field
  assignmentMarksAverage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  finalExamMarks: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  currentGPA: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  letterGrade: {
    type: DataTypes.STRING,
    defaultValue: 'N/A'
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  week: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'low'
  }
}, {
  timestamps: true
});

// Associate Grade with Module
Grade.belongsTo(Module, { foreignKey: 'moduleId' });
Module.hasMany(Grade, { foreignKey: 'moduleId' });

module.exports = Grade;
