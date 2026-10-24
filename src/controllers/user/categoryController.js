import CategorySchema from "../../models/CategorySchema.js"

export const getCategories = async (req, res) => {
    try {
        const categories = await CategorySchema.find();
        res.status(200).json({
            success: true,
            message: "all categories",
            categories
        })
    } catch (error) {
        res.status(500).json({
            message: "internal server error",
            error: error.message
        })

    }
}