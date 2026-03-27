const ExamPreparation = require("../models/ExamPreparationModel");

// Create new exam preparation
const createExamPreparation = async (req, res) => {
  try {
    const {
      subject,
      examTitle,
      examDate,
      startTime,
      endTime,
      venue,
      priority,
      status,
      preparationProgress,
      studyHoursTarget,
      notes,
    } = req.body;

    if (!subject || !examTitle || !examDate) {
      return res.status(400).json({
        success: false,
        message: "Subject, exam title, and exam date are required.",
      });
    }

    const newExam = await ExamPreparation.create({
      subject,
      examTitle,
      examDate,
      startTime,
      endTime,
      venue,
      priority,
      status,
      preparationProgress,
      studyHoursTarget,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Exam preparation record created successfully.",
      data: newExam,
    });
  } catch (error) {
    console.error("Error creating exam preparation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create exam preparation record.",
      error: error.message,
    });
  }
};

// Get all exam preparations
const getAllExamPreparations = async (req, res) => {
  try {
    const exams = await ExamPreparation.findAll({
      order: [["examDate", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    console.error("Error fetching exam preparations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam preparation records.",
      error: error.message,
    });
  }
};

// Get single exam preparation by ID
const getExamPreparationById = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await ExamPreparation.findByPk(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam preparation record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    console.error("Error fetching exam preparation by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam preparation record.",
      error: error.message,
    });
  }
};

// Update exam preparation
const updateExamPreparation = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await ExamPreparation.findByPk(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam preparation record not found.",
      });
    }

    const {
      subject,
      examTitle,
      examDate,
      startTime,
      endTime,
      venue,
      priority,
      status,
      preparationProgress,
      studyHoursTarget,
      notes,
    } = req.body;

    await exam.update({
      subject,
      examTitle,
      examDate,
      startTime,
      endTime,
      venue,
      priority,
      status,
      preparationProgress,
      studyHoursTarget,
      notes,
    });

    return res.status(200).json({
      success: true,
      message: "Exam preparation record updated successfully.",
      data: exam,
    });
  } catch (error) {
    console.error("Error updating exam preparation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update exam preparation record.",
      error: error.message,
    });
  }
};

// Delete exam preparation
const deleteExamPreparation = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await ExamPreparation.findByPk(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam preparation record not found.",
      });
    }

    await exam.destroy();

    return res.status(200).json({
      success: true,
      message: "Exam preparation record deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting exam preparation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete exam preparation record.",
      error: error.message,
    });
  }
};

// Get upcoming exams only
const getUpcomingExams = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const exams = await ExamPreparation.findAll({
      where: {
        examDate: {
          [require("sequelize").Op.gte]: today,
        },
      },
      order: [["examDate", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    console.error("Error fetching upcoming exams:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming exams.",
      error: error.message,
    });
  }
};

module.exports = {
  createExamPreparation,
  getAllExamPreparations,
  getExamPreparationById,
  updateExamPreparation,
  deleteExamPreparation,
  getUpcomingExams,
};