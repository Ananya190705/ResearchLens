
import express from "express";
import { searchAcademicPapers } from "../controllers/discoveryController.js";

const router = express.Router();

router.get("/search", searchAcademicPapers);

export default router;
