const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RESOURCE_TYPES = ['lecture', 'lab', 'tutorial', 'note'];

const ModuleResource = sequelize.define(
  'ModuleResource',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    moduleId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    resourceType: {
      type: DataTypes.ENUM(...RESOURCE_TYPES),
      allowNull: false,
      defaultValue: 'note'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    linkUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true
    },
    storedFileName: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    originalFileName: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    mimeType: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    timestamps: true,
    indexes: [{ fields: ['moduleId'] }, { fields: ['resourceType'] }]
  }
);

module.exports = ModuleResource;
module.exports.RESOURCE_TYPES = RESOURCE_TYPES;
