import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { adminMiddleware } from "./middleware/adminMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Global Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Root healthcheck
app.get("/", (req, res) => {
    res.json({ message: "Karnikripa Collection API is running" });
});

// User & Auth routes
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);

// Admin routes (supports both /admin and /api/admin)
app.use("/admin", authMiddleware, adminMiddleware, adminRoutes);
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Express Global Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

export default app;
