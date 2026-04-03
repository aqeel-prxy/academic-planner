const express = require("express");
const router = express.Router();
const { uploadExamPdfs } = require("../middleware/examPdfUpload");

const {
  createExamPreparation,
  getAllExamPreparations,
  getExamPreparationById,
  updateExamPreparation,
  deleteExamPreparation,
  getUpcomingExams,
  toggleExamPdfCompleted,
  deleteExamPdf,
} = require("../controller/examPreparationController");
const {
  askQuestion,
  getHistory,
  clearHistory,
} = require("../controller/examAiChatController");

// Create
router.post("/", uploadExamPdfs.array("lecturePdfs", 10), createExamPreparation);

// Get all
router.get("/", getAllExamPreparations);

// Get upcoming exams
router.get("/upcoming", getUpcomingExams);

// AI chat endpoints
router.post("/:examId/ai-chat/ask", askQuestion);
router.get("/:examId/ai-chat/history", getHistory);
router.delete("/:examId/ai-chat/history", clearHistory);

// Get one by ID
router.get("/:id", getExamPreparationById);

// Update
router.put("/:id", uploadExamPdfs.array("lecturePdfs", 10), updateExamPreparation);

// Toggle PDF completion
router.patch("/:id/pdfs/:pdfId", toggleExamPdfCompleted);

// Delete PDF item from an exam
router.delete("/:id/pdfs/:pdfId", deleteExamPdf);

// Delete
router.delete("/:id", deleteExamPreparation);

module.exports = router;