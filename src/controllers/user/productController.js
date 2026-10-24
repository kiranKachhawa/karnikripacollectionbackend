import mongoose from "mongoose";
import ProductSchema from "../../models/ProductSchema.js";
import CategorySchema from "../../models/CategorySchema.js";
import ReviewSchema from "../../models/ReviewSchema.js";

export const getProducts = async (req, res) => {
    try {
        const {
            trending,
            featured,
            bestseller,
            newArrival,
            search,
            category,
            minPrice,
            maxPrice,
            size,
            color,
            rating,
            sort,
            page,
            limit
        } = req.query;

        let query = { isActive: { $ne: false } };

        // Trending filter
        if (trending === "true") {
            query.isTrending = true;
        } else if (trending === "false") {
            query.isTrending = { $ne: true };
        }

        // Featured, Bestseller, New Arrival flags
        if (featured === "true") query.isFeatured = true;
        if (bestseller === "true") query.isBestseller = true;
        if (newArrival === "true") query.isNewArrival = true;

        // Search in name, description, slug
        if (search && search.trim() !== "") {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [
                { name: regex },
                { description: regex },
                { slug: regex }
            ];
        }

        // Category filter (either ObjectId or slug)
        if (category && category !== "all") {
            if (mongoose.Types.ObjectId.isValid(category)) {
                query.category = category;
            } else {
                const foundCategory = await CategorySchema.findOne({ slug: category });
                if (foundCategory) {
                    query.category = foundCategory._id;
                }
            }
        }

        // Price range filter (on discountPrice or price)
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.discountPrice = {};
            if (minPrice !== undefined && !isNaN(minPrice)) query.discountPrice.$gte = Number(minPrice);
            if (maxPrice !== undefined && !isNaN(maxPrice)) query.discountPrice.$lte = Number(maxPrice);
        }

        // Size filter
        if (size && size !== "all") {
            query.sizes = size;
        }

        // Color filter
        if (color && color !== "all") {
            query.colors = color;
        }

        // Rating filter
        if (rating && !isNaN(rating)) {
            query.rating = { $gte: Number(rating) };
        }

        // Sorting
        let sortOption = { createdAt: -1 };
        if (sort === "price_asc") sortOption = { discountPrice: 1 };
        else if (sort === "price_desc") sortOption = { discountPrice: -1 };
        else if (sort === "rating_desc") sortOption = { rating: -1 };
        else if (sort === "newest") sortOption = { createdAt: -1 };

        // Pagination
        const total = await ProductSchema.countDocuments(query);
        let productsQuery = ProductSchema.find(query).populate("category").sort(sortOption);

        if (page && limit) {
            const pageNum = parseInt(page, 10) || 1;
            const limitNum = parseInt(limit, 10) || 12;
            const skip = (pageNum - 1) * limitNum;
            productsQuery = productsQuery.skip(skip).limit(limitNum);

            const products = await productsQuery;
            return res.status(200).json({
                success: true,
                message: "Products fetched successfully",
                products,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum)
            });
        }

        const products = await productsQuery;

        res.status(200).json({
            message: trending === "true" ? "get trending products" : trending === "false" ? "get non-trending products" : "get all products",
            products,
            total,
            success: true,
        });
    } catch (error) {
        res.status(500).json({ message: "internal server error", error: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        let product;

        if (mongoose.Types.ObjectId.isValid(id)) {
            product = await ProductSchema.findById(id).populate("category");
        }
        
        if (!product) {
            product = await ProductSchema.findOne({ slug: id }).populate("category");
        }

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Fetch associated reviews
        const reviews = await ReviewSchema.find({ product: product._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            product,
            reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};