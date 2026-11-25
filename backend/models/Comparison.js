
import mongoose from "mongoose";

const comparisonSchema = new mongoose.Schema(
    {
        paperIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Paper",
                required: true
            }
        ],

        paperTitles: {
            type: [String],
            required: true
        },

        result: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Comparison = mongoose.model(
    "Comparison",
    comparisonSchema
);

export default Comparison;
