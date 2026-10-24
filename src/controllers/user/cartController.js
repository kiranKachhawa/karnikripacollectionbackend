import CartSchema from "../../models/CartSchema.js";
import ProductSchema from "../../models/ProductSchema.js";
import CouponSchema from "../../models/CouponSchema.js";

// Get user cart
export const getCart = async (req, res) => {
    try {
        let cart = await CartSchema.findOne({ user: req.user.id }).populate("items.product");

        if (!cart) {
            cart = await CartSchema.create({ user: req.user.id, items: [] });
        }

        // Calculate totals
        let subtotal = 0;
        const validItems = [];

        for (const item of cart.items) {
            if (item.product) {
                const itemPrice = item.product.discountPrice !== undefined ? item.product.discountPrice : item.product.price;
                item.price = itemPrice;
                subtotal += itemPrice * item.quantity;
                validItems.push(item);
            }
        }

        cart.items = validItems;

        let discount = 0;
        if (cart.coupon && cart.coupon.code) {
            const coupon = await CouponSchema.findOne({ code: cart.coupon.code, isActive: true });
            if (coupon && (!coupon.expiryDate || new Date(coupon.expiryDate) > new Date())) {
                if (coupon.discountType === "percentage") {
                    discount = Math.round((subtotal * coupon.discountValue) / 100);
                    if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
                        discount = coupon.maxDiscount;
                    }
                } else {
                    discount = coupon.discountValue;
                }
                cart.coupon.discountAmount = discount;
            } else {
                cart.coupon = { code: "", discountPercent: 0, discountAmount: 0 };
            }
        }

        const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
        const finalTotal = Math.max(0, subtotal - discount + shipping);

        res.status(200).json({
            success: true,
            cart: {
                _id: cart._id,
                items: cart.items,
                subtotal,
                discount,
                shipping,
                finalTotal,
                coupon: cart.coupon
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1, size = "M", color = "Default" } = req.body;

        const product = await ProductSchema.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items in stock`
            });
        }

        let cart = await CartSchema.findOne({ user: req.user.id });
        if (!cart) {
            cart = new CartSchema({ user: req.user.id, items: [] });
        }

        const price = product.discountPrice !== undefined ? product.discountPrice : product.price;

        // Check if matching variant exists
        const existingIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId && item.size === size && item.color === color
        );

        if (existingIndex > -1) {
            const newQty = cart.items[existingIndex].quantity + Number(quantity);
            if (newQty > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add more. Stock limit of ${product.stock} reached.`
                });
            }
            cart.items[existingIndex].quantity = newQty;
            cart.items[existingIndex].price = price;
        } else {
            cart.items.push({
                product: productId,
                quantity: Number(quantity),
                size,
                color,
                price
            });
        }

        await cart.save();
        return getCart(req, res);
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
        }

        const cart = await CartSchema.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Cart item not found" });
        }

        const product = await ProductSchema.findById(item.product);
        if (product && product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items in stock`
            });
        }

        item.quantity = Number(quantity);
        await cart.save();

        return getCart(req, res);
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await CartSchema.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
        await cart.save();

        return getCart(req, res);
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Clear cart
export const clearCart = async (req, res) => {
    try {
        let cart = await CartSchema.findOne({ user: req.user.id });
        if (cart) {
            cart.items = [];
            cart.coupon = { code: "", discountPercent: 0, discountAmount: 0 };
            await cart.save();
        }
        res.status(200).json({ success: true, message: "Cart cleared" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Apply coupon to cart
export const applyCouponToCart = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: "Coupon code is required" });
        }

        const coupon = await CouponSchema.findOne({
            code: code.trim().toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Invalid or inactive coupon code" });
        }

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ success: false, message: "This coupon has expired" });
        }

        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
        }

        let cart = await CartSchema.findOne({ user: req.user.id }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        let subtotal = 0;
        for (const item of cart.items) {
            if (item.product) {
                const price = item.product.discountPrice !== undefined ? item.product.discountPrice : item.product.price;
                subtotal += price * item.quantity;
            }
        }

        if (subtotal < coupon.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`
            });
        }

        let discount = 0;
        if (coupon.discountType === "percentage") {
            discount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            discount = coupon.discountValue;
        }

        cart.coupon = {
            code: coupon.code,
            discountPercent: coupon.discountType === "percentage" ? coupon.discountValue : 0,
            discountAmount: discount
        };

        await cart.save();
        return getCart(req, res);
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Remove coupon from cart
export const removeCouponFromCart = async (req, res) => {
    try {
        const cart = await CartSchema.findOne({ user: req.user.id });
        if (cart) {
            cart.coupon = { code: "", discountPercent: 0, discountAmount: 0 };
            await cart.save();
        }
        return getCart(req, res);
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
