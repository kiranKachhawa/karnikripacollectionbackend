import WishlistSchema from "../../models/WishlistSchema.js";
import CartSchema from "../../models/CartSchema.js";
import ProductSchema from "../../models/ProductSchema.js";

// Get user's wishlist
export const getWishlist = async (req, res) => {
    try {
        let wishlist = await WishlistSchema.findOne({ user: req.user.id }).populate("products");
        if (!wishlist) {
            wishlist = await WishlistSchema.create({ user: req.user.id, products: [] });
        }

        // Filter out null products
        wishlist.products = wishlist.products.filter(p => p !== null);

        res.status(200).json({
            success: true,
            wishlist: wishlist.products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Toggle product in wishlist (Add if not present, remove if already present)
export const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        let wishlist = await WishlistSchema.findOne({ user: req.user.id });
        if (!wishlist) {
            wishlist = new WishlistSchema({ user: req.user.id, products: [] });
        }

        const index = wishlist.products.findIndex(p => p.toString() === productId);
        let action = "added";

        if (index > -1) {
            wishlist.products.splice(index, 1);
            action = "removed";
        } else {
            wishlist.products.push(productId);
            action = "added";
        }

        await wishlist.save();
        const updatedWishlist = await WishlistSchema.findById(wishlist._id).populate("products");

        res.status(200).json({
            success: true,
            message: `Product ${action} ${action === 'added' ? 'to' : 'from'} wishlist`,
            action,
            wishlist: updatedWishlist.products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        let wishlist = await WishlistSchema.findOne({ user: req.user.id });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: "Wishlist not found" });
        }

        wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
        await wishlist.save();

        const updatedWishlist = await WishlistSchema.findById(wishlist._id).populate("products");

        res.status(200).json({
            success: true,
            message: "Removed from wishlist",
            wishlist: updatedWishlist.products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Move item from wishlist to cart
export const moveToCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const { size = "M", color = "Default" } = req.body;

        const product = await ProductSchema.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Add to Cart
        let cart = await CartSchema.findOne({ user: req.user.id });
        if (!cart) {
            cart = new CartSchema({ user: req.user.id, items: [] });
        }

        const price = product.discountPrice !== undefined ? product.discountPrice : product.price;
        const existingIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId && item.size === size && item.color === color
        );

        if (existingIndex > -1) {
            cart.items[existingIndex].quantity += 1;
        } else {
            cart.items.push({
                product: productId,
                quantity: 1,
                size,
                color,
                price
            });
        }
        await cart.save();

        // Remove from Wishlist
        let wishlist = await WishlistSchema.findOne({ user: req.user.id });
        if (wishlist) {
            wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
            await wishlist.save();
        }

        const updatedWishlist = await WishlistSchema.findById(wishlist?._id).populate("products");

        res.status(200).json({
            success: true,
            message: "Moved to cart successfully",
            wishlist: updatedWishlist ? updatedWishlist.products : []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
