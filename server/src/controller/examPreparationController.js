const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const ExamPreparation = require("../models/ExamPreparationModel");
const { deleteExamAiChatSession } = require("../services/aiExamChatService");

const uploadsBaseDir = path.join(__dirname, "../../uploads/exam-pdfs");

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const toNumberOrDefault = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toStringOrEmpty = (value) => (value == null ? "" : String(value));

const makePdfUrl = (req, fileName) => `${req.protocol}://${req.get("host")}/uploads/exam-pdfs/${fileName}`;

const buildUploadedPdfItems = (req) => {
  const files = Array.isArray(req.files) ? req.files : [];
  return files.map((file) => ({
    id: file.filename,
    fileName: file.originalname,
    storedFileName: file.filename,
    url: makePdfUrl(req, file.filename),
    completed: false,
  }));
};

const parseExistingPdfItems = (body) => {
  const list = ensureArray(body.lecturePdfs);
  return list
    .filter((item) => item && item.storedFileName)
    .map((item) => ({
      id: toStringOrEmpty(item.id || item.storedFileName),
      fileName: toStringOrEmpty(item.fileName || item.storedFileName),
      storedFileName: toStringOrEmpty(item.storedFileName),
      url: toStringOrEmpty(item.url),
      completed: Boolean(item.completed),
    }));
};

const removeStoredFile = (storedFileName) => {
  if (!storedFileName) return;
  const fullPath = path.join(uploadsBaseDir, storedFileName);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

const uploadsBaseDir = path.join(__dirname, "../../uploads/exam-pdfs");

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const toNumberOrDefault = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toStringOrEmpty = (value) => (value == null ? "" : String(value));

const makePdfUrl = (req, fileName) => `${req.protocol}://${req.get("host")}/uploads/exam-pdfs/${fileName}`;

const buildUploadedPdfItems = (req) => {
  const files = Array.isArray(req.files) ? req.files : [];
  return files.map((file) => ({
    id: file.filename,
    fileName: file.originalname,
    storedFileName: file.filename,
    url: makePdfUrl(req, file.filename),
    completed: false,
  }));
};

const parseExistingPdfItems = (body) => {
  const list = ensureArray(body.lecturePdfs);
  return list
    .filter((item) => item && item.storedFileName)
    .map((item) => ({
      id: toStringOrEmpty(item.id || item.storedFileName),
      fileName: toStringOrEmpty(item.fileName || item.storedFileName),
      storedFileName: toStringOrEmpty(item.storedFileName),
      url: toStringOrEmpty(item.url),
      completed: Boolean(item.completed),
    }));
};

const removeStoredFile = (storedFileName) => {
  if (!storedFileName) return;
  const fullPath = path.join(uploadsBaseDir, storedFileName);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

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
      preparationProgress: toNumberOrDefault(preparationProgress, 0),
      studyHoursTarget: toNumberOrDefault(studyHoursTarget, 0),
      notes,
      lecturePdfs: buildUploadedPdfItems(req),
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

    const existingPdfItems = parseExistingPdfItems(req.body);
    const uploadedPdfItems = buildUploadedPdfItems(req);
    const mergedPdfItems = [...existingPdfItems, ...uploadedPdfItems];

    await exam.update({
      subject,
      examTitle,
      examDate,
      startTime,
      endTime,
      venue,
      priority,
      status,
      preparationProgress: toNumberOrDefault(preparationProgress, 0),
      studyHoursTarget: toNumberOrDefault(studyHoursTarget, 0),
      notes,
      lecturePdfs: mergedPdfItems,
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

    const pdfItems = ensureArray(exam.lecturePdfs);
    pdfItems.forEach((pdf) => removeStoredFile(pdf.storedFileName));

<<<<<<< HEAD
    await deleteExamAiChatSession(id);

=======
>>>>>>> origin/main
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
          [Op.gte]: today,
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

const toggleExamPdfCompleted = async (req, res) => {
  try {
    const { id, pdfId } = req.params;
    const { completed } = req.body;

    const exam = await ExamPreparation.findByPk(id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam preparation record not found.",
      });
    }

    const pdfItems = ensureArray(exam.lecturePdfs);
    const target = pdfItems.find((item) => String(item.id) === String(pdfId));
    if (!target) {
      return res.status(404).json({
        success: false,
        message: "PDF item not found for this exam.",
      });
    }

    target.completed = Boolean(completed);
    await exam.update({ lecturePdfs: pdfItems });

    return res.status(200).json({
      success: true,
      message: "PDF completion status updated.",
      data: exam,
    });
  } catch (error) {
    console.error("Error toggling PDF completion:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update PDF completion status.",
      error: error.message,
    });
  }
};

const deleteExamPdf = async (req, res) => {
  try {
    const { id, pdfId } = req.params;
    const exam = await ExamPreparation.findByPk(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam preparation record not found.",
      });
    }

    const pdfItems = ensureArray(exam.lecturePdfs);
    const target = pdfItems.find((item) => String(item.id) === String(pdfId));
    if (!target) {
      return res.status(404).json({
        success: false,
        message: "PDF item not found for this exam.",
      });
    }

    const remaining = pdfItems.filter((item) => String(item.id) !== String(pdfId));
    removeStoredFile(target.storedFileName);

    await exam.update({ lecturePdfs: remaining });

    return res.status(200).json({
      success: true,
      message: "PDF removed successfully.",
      data: exam,
    });
  } catch (error) {
    console.error("Error deleting exam PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete exam PDF.",
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
  toggleExamPdfCompleted,
  deleteExamPdf,
};