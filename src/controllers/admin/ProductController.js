import ProductSchema from "../../models/ProductSchema.js";

export const GetAllProducts = async (req, res) => {
    try {
        const { search, category, page = 1, limit = 100 } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { slug: { $regex: search, $options: "i" } },
                { sku: { $regex: search, $options: "i" } }
            ];
        }
        if (category) filter.category = category;

        const skip = (Number(page) - 1) * Number(limit);
        const [products, total] = await Promise.all([
            ProductSchema.find(filter)
                .populate("category", "name slug")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            ProductSchema.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            products,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const AddProduct = async (req, res) => {
    const {
        name,
        price,
        category,
        slug,
        image,
        images,
        stock,
        discount,
        discountPrice,
        rating,
        description,
        review,
        isTrending,
        sizes,
        colors,
        sku,
        subcategory,
        isFeatured,
        isBestseller,
        isNewArrival,
        isActive
    } = req.body;

    try {
        const product = new ProductSchema({
            name,
            slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            price: Number(price),
            category,
            discount: Number(discount) || 0,
            discountPrice: discountPrice !== undefined ? Number(discountPrice) : Number(price),
            description,
            review: review || "",
            rating: Number(rating) || 4.5,
            image,
            images: Array.isArray(images) ? images : (image ? [image] : []),
            stock: Number(stock) || 0,
            sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ["S", "M", "L", "XL"],
            colors: Array.isArray(colors) && colors.length > 0 ? colors : ["Default"],
            sku: sku || "",
            subcategory: subcategory || "",
            isTrending: isTrending !== undefined ? Boolean(isTrending) : false,
            isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
            isBestseller: isBestseller !== undefined ? Boolean(isBestseller) : false,
            isNewArrival: isNewArrival !== undefined ? Boolean(isNewArrival) : true,
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });

        await product.save();
        res.status(200).json({ success: true, message: "Product added successfully", products: product });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const UpdateProduct = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        price,
        category,
        slug,
        image,
        images,
        stock,
        discount,
        discountPrice,
        rating,
        description,
        review,
        isTrending,
        sizes,
        colors,
        sku,
        subcategory,
        isFeatured,
        isBestseller,
        isNewArrival,
        isActive
    } = req.body;

    try {
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = Number(price);
        if (category !== undefined) updateData.category = category;
        if (slug !== undefined) updateData.slug = slug;
        if (image !== undefined) updateData.image = image;
        if (images !== undefined) updateData.images = images;
        if (stock !== undefined) updateData.stock = Number(stock);
        if (discount !== undefined) updateData.discount = Number(discount);
        if (discountPrice !== undefined) updateData.discountPrice = Number(discountPrice);
        if (rating !== undefined) updateData.rating = Number(rating);
        if (description !== undefined) updateData.description = description;
        if (review !== undefined) updateData.review = review;
        if (isTrending !== undefined) updateData.isTrending = Boolean(isTrending);
        if (sizes !== undefined) updateData.sizes = sizes;
        if (colors !== undefined) updateData.colors = colors;
        if (sku !== undefined) updateData.sku = sku;
        if (subcategory !== undefined) updateData.subcategory = subcategory;
        if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
        if (isBestseller !== undefined) updateData.isBestseller = Boolean(isBestseller);
        if (isNewArrival !== undefined) updateData.isNewArrival = Boolean(isNewArrival);
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);

        const updatedProduct = await ProductSchema.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const DeleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedProduct = await ProductSchema.findByIdAndDelete(id);
        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, message: "Product deleted successfully", product: deletedProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};