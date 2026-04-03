const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ExamPreparation = sequelize.define(
  "ExamPreparation",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Subject is required",
        },
      },
    },

    examTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Exam title is required",
        },
      },
    },

    examDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Exam date is required",
        },
      },
    },

    startTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    endTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    venue: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    priority: {
      type: DataTypes.ENUM("Low", "Medium", "High"),
      allowNull: false,
      defaultValue: "Medium",
    },

    status: {
      type: DataTypes.ENUM("Not Started", "In Progress", "Completed"),
      allowNull: false,
      defaultValue: "Not Started",
    },

    preparationProgress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },

    studyHoursTarget: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    lecturePdfs: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      get() {
        const raw = this.getDataValue("lecturePdfs");
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          return [];
        }
      },
      set(value) {
        const normalized = Array.isArray(value) ? value : [];
        this.setDataValue("lecturePdfs", JSON.stringify(normalized));
      },
    },
  },
  {
    tableName: "exam_preparations",
    timestamps: true,
  }
);

module.exports = ExamPreparation;