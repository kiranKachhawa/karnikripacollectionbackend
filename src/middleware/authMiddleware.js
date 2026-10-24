import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    try {
        // header se token nikalo
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // user data attach karo request me
        req.user = decoded;

        next(); // 👈 important
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};