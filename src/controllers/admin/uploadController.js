export const uploadSingleImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided" });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Upload failed", error: error.message });
    }
};

export const uploadMultipleImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "No image files provided" });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const imageUrls = req.files.map((file) => `${baseUrl}/uploads/${file.filename}`);

        res.status(200).json({
            success: true,
            message: "Images uploaded successfully",
            imageUrls,
            imageUrl: imageUrls[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Upload failed", error: error.message });
    }
};
