import ReviewSchema from "../../models/ReviewSchema.js";
import ProductSchema from "../../models/ProductSchema.js";
import UserSchema from "../../models/UserSchema.js";

// Add review to a product
export const createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({ success: false, message: "Rating and comment are required" });
        }

        const product = await ProductSchema.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const user = await UserSchema.findById(req.user.id);
        const userName = user ? user.name : "Anonymous";

        // Check if user already reviewed this product
        const existingReview = await ReviewSchema.findOne({
            user: req.user.id,
            product: productId
        });

        if (existingReview) {
            existingReview.rating = Number(rating);
            existingReview.comment = comment;
            await existingReview.save();
        } else {
            await ReviewSchema.create({
                user: req.user.id,
                product: productId,
                userName,
                rating: Number(rating),
                comment
            });
        }

        // Recalculate average rating
        const allReviews = await ReviewSchema.find({ product: productId });
        const avgRating = (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1);

        product.rating = Number(avgRating);
        product.ratingsCount = allReviews.length;
        if (!product.review && comment) {
            product.review = comment;
        }
        await product.save();

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            reviews: allReviews,
            productRating: product.rating,
            ratingsCount: product.ratingsCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Get reviews for a product
export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await ReviewSchema.find({ product: productId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
