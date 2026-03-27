const express = require("express");
const router = express.Router();

const {
  createExamPreparation,
  getAllExamPreparations,
  getExamPreparationById,
  updateExamPreparation,
  deleteExamPreparation,
  getUpcomingExams,
} = require("../controller/examPreparationController");

// Create
router.post("/", createExamPreparation);

// Get all
router.get("/", getAllExamPreparations);

// Get upcoming exams
router.get("/upcoming", getUpcomingExams);

// Get one by ID
router.get("/:id", getExamPreparationById);

// Update
router.put("/:id", updateExamPreparation);

// Delete
router.delete("/:id", deleteExamPreparation);

module.exports = router;