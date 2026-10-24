import CategorySchema from "../../models/CategorySchema.js";

export const AddCategory = async (req, res) => {
    const { name, image, slug, description } = req.body;
    try {
        const defaultImage = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80";
        const categories = new CategorySchema({
            name: name,
            image: image && image.trim() !== "" ? image.trim() : defaultImage,
            slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            description: description || ""
        });
        await categories.save();
        res.status(200).json({
            success: true,
            message: "Category added successfully",
            categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const UpdateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, image, slug, description, isActive } = req.body;
    try {
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (image !== undefined) updateData.image = image;
        if (slug !== undefined) updateData.slug = slug;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;

        const category = await CategorySchema.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const DeleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedCategory = await CategorySchema.findByIdAndDelete(id);
        if (!deletedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(200).json({ success: true, message: "Category deleted successfully", category: deletedCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
