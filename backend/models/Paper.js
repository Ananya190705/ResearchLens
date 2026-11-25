
import mongoose from "mongoose";

const paperSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    authors: {
        type: [String],
        default: []
    },

    abstract: {
        type: String,
        default: ""
    },

    publicationYear: {
        type: Number
    },

    algorithm: {
        type: String,
        default: ""
    },

    methodology: {
        type: String,
        default: ""
    },

    // PDF extraction fields
    extractedText: {
        type: String,
        default: ""
    },

    totalPages: {
        type: Number,
        default: 0
    },

    extractionStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    },

    // Stores the uploaded PDF location
    pdfPath: {
        type: String,
        default: ""
    },
    analysis: {
    type: mongoose.Schema.Types.Mixed,
    default: null
},
analysisStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
}

}, { timestamps: true });

const Paper = mongoose.model("Paper", paperSchema);

export default Paper;
