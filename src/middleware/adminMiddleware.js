import UserSchema from "../models/UserSchema.js";

export const adminMiddleware = async (req, res, next) => {
    try {
        // req.user is set by authMiddleware
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: No token credentials found" });
        }

        const user = await UserSchema.findById(req.user.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admin role required." });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
