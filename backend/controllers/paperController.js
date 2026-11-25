
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import Paper from "../models/Paper.js";
import Comparison from "../models/Comparison.js";

// GET - Retrieve all papers
export const getAllPapers = async (req, res) => {
    try {
        const papers = await Paper.find().sort({ createdAt: -1 });

        res.status(200).json(papers);
    } catch (error) {
        console.error("Fetch papers error:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// POST - Add a new paper manually
export const addPaper = async (req, res) => {
    try {
        const newPaper = await Paper.create(req.body);

        res.status(201).json({
            message: "Paper added successfully",
            paper: newPaper
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// PUT - Update a paper
export const updatePaper = async (req, res) => {
    try {
        const updatedPaper = await Paper.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedPaper) {
            return res.status(404).json({
                message: "Paper not found"
            });
        }

        res.status(200).json({
            message: "Paper updated successfully",
            paper: updatedPaper
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE - Delete a paper

// DELETE - Delete a paper and its uploaded PDF
export const deletePaper = async (req, res) => {
    try {
        const deletedPaper = await Paper.findByIdAndDelete(req.params.id);

        if (!deletedPaper) {
            return res.status(404).json({
                message: "Paper not found"
            });
        }

        // Delete the physical PDF if one exists
        if (deletedPaper.pdfPath) {
            const filePath = path.resolve(deletedPaper.pdfPath);

            try {
                await fs.promises.unlink(filePath);
                console.log("PDF file deleted:", filePath);
            } catch (fileError) {
                // File may already be missing; the database record is still deleted
                if (fileError.code !== "ENOENT") {
                    console.error("PDF deletion error:", fileError.message);
                }
            }
        }

        return res.status(200).json({
            message: "Paper deleted successfully"
        });

    } catch (error) {
        console.error("Delete paper error:", error.message);

        return res.status(500).json({
            message: error.message
        });
    }
};


// POST - Upload a research paper PDF
export const uploadPaper = async (req, res) => {
    try {
        console.log("Upload controller reached");
        console.log("Uploaded file:", req.file);

        if (!req.file) {
            return res.status(400).json({
                message: "No PDF file received"
            });
        }

        const newPaper = await Paper.create({
            title: path.basename(
                req.file.originalname,
                path.extname(req.file.originalname)
            ),
            authors: [],
            pdfPath: req.file.path
        });

        console.log("Saved database:", newPaper.constructor.db.name);
        console.log("Saved collection:", newPaper.constructor.collection.name);
        console.log("Saved document ID:", newPaper._id);

        return res.status(201).json({
            message: "PDF uploaded successfully",
            paper: newPaper
        });

    } catch (error) {
        console.error("UPLOAD ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};

// POST - Extract text from uploaded PDF
export const extractPaperText = async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);

        if (!paper) {
            return res.status(404).json({
                message: "Paper not found"
            });
        }

        // Check whether a PDF path exists
        if (!paper.pdfPath) {
            return res.status(400).json({
                message: "No PDF file is associated with this paper. Please upload it again."
            });
        }

        paper.extractionStatus = "pending";
        await paper.save();

        const filePath = path.resolve(paper.pdfPath);

        console.log("Paper ID:", paper._id);
        console.log("MongoDB pdfPath:", paper.pdfPath);
        console.log("Resolved path:", filePath);

        // Check whether the path exists
        if (!fs.existsSync(filePath)) {
            paper.extractionStatus = "failed";
            await paper.save();

            return res.status(404).json({
                message: "PDF file not found"
            });
        }

        // Check whether the path is a file
        if (!fs.statSync(filePath).isFile()) {
            paper.extractionStatus = "failed";
            await paper.save();

            return res.status(400).json({
                message: "Stored path is a directory, not a PDF file"
            });
        }

        // Prepare PDF for FastAPI
        const form = new FormData();

        form.append("file", fs.createReadStream(filePath));

        // Send PDF to Python AI service
        const response = await axios.post(
            `${process.env.AI_SERVICE_URL}/extract-pdf`,
            form,
            {
                headers: form.getHeaders(),
                maxBodyLength: 20 * 1024 * 1024
            }
        );

        // Save extracted information
        paper.extractedText = response.data.extracted_text;
        paper.totalPages = response.data.total_pages;
        paper.extractionStatus = "completed";

        await paper.save();

        console.log("PDF extraction completed:", paper._id);

        return res.status(200).json({
            message: "PDF text extracted successfully",
            paper
        });

    } catch (error) {
        console.error("Extraction error:", error.message);

        await Paper.findByIdAndUpdate(req.params.id, {
            extractionStatus: "failed"
        }).catch(updateError => {
            console.error("Status update error:", updateError.message);
        });

        return res.status(500).json({
            message: "PDF extraction failed",
            error: error.message
        });
    }
};

// POST - Analyze research paper using AI
export const analyzePaper = async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);

        if (!paper) {
            return res.status(404).json({
                message: "Paper not found"
            });
        }

        if (!paper.extractedText) {
            return res.status(400).json({
                message: "Extract the PDF text before analysis"
            });
        }

        paper.analysisStatus = "pending";
        await paper.save();

        const response = await axios.post(
            `${process.env.AI_SERVICE_URL}/analyze-paper`,
            {
                extracted_text: paper.extractedText
            }
        );

        paper.analysis = response.data.analysis;
        paper.analysisStatus = "completed";

        await paper.save();

        console.log("Paper analysis completed:", paper._id);

        return res.status(200).json({
            message: "Research paper analyzed successfully",
            paper
        });

    } catch (error) {
        console.error("Paper analysis error:", error.message);

        await Paper.findByIdAndUpdate(req.params.id, {
            analysisStatus: "failed"
        }).catch(updateError => {
            console.error("Status update error:", updateError.message);
        });

        return res.status(500).json({
            message: "Research paper analysis failed",
            error: error.message
        });
    }
};


export const comparePapers = async (req, res) => {
    try {
        const { paperIds } = req.body;

        if (!Array.isArray(paperIds) || paperIds.length < 2) {
            return res.status(400).json({
                message: "Select at least two papers to compare"
            });
        }

        const papers = await Paper.find({
            _id: { $in: paperIds }
        });

        if (papers.length !== paperIds.length) {
            return res.status(404).json({
                message: "One or more papers were not found"
            });
        }

        const unanalyzedPapers = papers.filter(
            paper =>
                paper.analysisStatus !== "completed" ||
                !paper.analysis
        );

        if (unanalyzedPapers.length > 0) {
            return res.status(400).json({
                message: "Please analyze all selected papers before comparison"
            });
        }

        const comparisonData = papers.map(paper => ({
            title: paper.title,
            analysis: paper.analysis
        }));

        const response = await axios.post(
            `${process.env.AI_SERVICE_URL}/compare-papers`,
            {
                papers: comparisonData
            }
        );

        // Save comparison report in MongoDB
        const savedComparison = await Comparison.create({
            paperIds: papers.map(paper => paper._id),
            paperTitles: papers.map(paper => paper.title),
            result: response.data.comparison
        });

        return res.status(201).json({
            message: "Comparison completed and saved successfully",
            comparison: savedComparison
        });

    } catch (error) {
        console.error("Comparison error:", error.message);

        return res.status(500).json({
            message: "Paper comparison failed",
            error: error.message
        });
    }
};

// GET - Retrieve comparison history
export const getComparisonHistory = async (req, res) => {
    try {
        const comparisons = await Comparison.find()
            .sort({ createdAt: -1 });

        return res.status(200).json(comparisons);

    } catch (error) {
        console.error("Comparison history error:", error.message);

        return res.status(500).json({
            message: error.message
        });
    }
};


// DELETE - Delete a comparison report
export const deleteComparison = async (req, res) => {
    try {
        const deletedComparison = await Comparison.findByIdAndDelete(
            req.params.id
        );

        if (!deletedComparison) {
            return res.status(404).json({
                message: "Comparison report not found"
            });
        }

        return res.status(200).json({
            message: "Comparison report deleted successfully"
        });

    } catch (error) {
        console.error("Delete comparison error:", error.message);

        return res.status(500).json({
            message: error.message
        });
    }
};
