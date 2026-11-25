
import express from "express";
import upload from "../middleware/upload.js";

import {
    getAllPapers,
    addPaper,
    updatePaper,
    deletePaper,
    uploadPaper,
    extractPaperText,
    analyzePaper,
    comparePapers,
    getComparisonHistory,
    deleteComparison
} from "../controllers/paperController.js";

const router = express.Router();

// GET all papers
router.get("/", getAllPapers);

// POST a paper
router.post("/", addPaper);

// Comparison routes - keep before generic /:id routes
router.post("/compare", comparePapers);
router.get("/comparisons", getComparisonHistory);
router.delete("/comparisons/:id", deleteComparison);

// PUT a paper
router.put("/:id", updatePaper);

// DELETE a paper
router.delete("/:id", deletePaper);

// Upload PDF
router.post("/upload", upload.single("paper"), uploadPaper);

// Extract PDF text
router.post("/:id/extract", extractPaperText);

// Analyze paper
router.post("/:id/analyze", analyzePaper);

export default router;
