const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ExamAiChatSession = sequelize.define(
  "ExamAiChatSession",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    examPreparationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    messages: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      get() {
        const raw = this.getDataValue("messages");
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
        this.setDataValue("messages", JSON.stringify(normalized));
      },
    },
  },
  {
    tableName: "exam_ai_chat_sessions",
    timestamps: true,
  }
);

module.exports = ExamAiChatSession;
