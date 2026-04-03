const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const parseChecklist = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  course: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  weighting: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  priority: {
    type: DataTypes.ENUM('High', 'Medium', 'Low'),
    allowNull: false,
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Completed'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  attachmentName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  checklist: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      return parseChecklist(this.getDataValue('checklist'));
    },
    set(value) {
      this.setDataValue('checklist', JSON.stringify(parseChecklist(value)));
    }
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Assignment;
