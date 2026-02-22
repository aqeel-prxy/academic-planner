const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end: {
    type: DataTypes.DATE,
    allowNull: false
  },
  backgroundColor: {
    type: DataTypes.STRING,
    defaultValue: '#3788d8'
  },
  borderColor: {
    type: DataTypes.STRING,
    defaultValue: '#3788d8'
  },
  courseCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true
});

module.exports = Event;