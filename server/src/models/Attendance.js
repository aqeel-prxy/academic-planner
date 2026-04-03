const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  timetableKey: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'default'
  },
  moduleName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  requiredLectures: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  attendedLectures: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['timetableKey', 'moduleName']
    }
  ]
});

module.exports = Attendance;
