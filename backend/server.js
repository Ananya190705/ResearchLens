import cors from "cors";
import express from "express";
import paperRoutes from "./routes/paperRoutes.js";
import logger from "./middleware/logger.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import discoveryRoutes from "./routes/discoveryRoutes.js";

dotenv.config();

const app = express();
app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(express.json());
app.use(logger);
app.use("/api/discovery", discoveryRoutes);

// Welcome route
app.get("/", (req, res) => {
    res.send("Welcome to ResearchLens");
});

// Paper routes
app.use("/api/papers", paperRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
