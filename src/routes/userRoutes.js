import express from "express";
import { getCategories } from "../controllers/user/categoryController.js";
import { getProducts, getProductById } from "../controllers/user/productController.js";
import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    applyCouponToCart,
    removeCouponFromCart
} from "../controllers/user/cartController.js";
import {
    getWishlist,
    toggleWishlist,
    removeFromWishlist,
    moveToCart
} from "../controllers/user/wishlistController.js";
import {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder
} from "../controllers/user/orderController.js";
import { createReview, getProductReviews } from "../controllers/user/reviewController.js";
import { validateCoupon } from "../controllers/user/couponController.js";
import { createPaymentOrder, verifyPayment } from "../controllers/user/paymentController.js";
import { subscribeNewsletter } from "../controllers/user/newsletterController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Catalog
router.get("/categories", getCategories);
router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.get("/reviews/:productId", getProductReviews);
router.post("/coupons/validate", validateCoupon);
router.post("/newsletter", subscribeNewsletter);

// Cart (Protected)
router.get("/cart", authMiddleware, getCart);
router.post("/cart", authMiddleware, addToCart);
router.put("/cart/:itemId", authMiddleware, updateCartItem);
router.delete("/cart/:itemId", authMiddleware, removeCartItem);
router.delete("/cart", authMiddleware, clearCart);
router.post("/cart/apply-coupon", authMiddleware, applyCouponToCart);
router.post("/cart/remove-coupon", authMiddleware, removeCouponFromCart);

// Wishlist (Protected)
router.get("/wishlist", authMiddleware, getWishlist);
router.post("/wishlist", authMiddleware, toggleWishlist);
router.delete("/wishlist/:productId", authMiddleware, removeFromWishlist);
router.post("/wishlist/move-to-cart/:productId", authMiddleware, moveToCart);

// Orders (Protected)
router.post("/orders", authMiddleware, createOrder);
router.get("/orders", authMiddleware, getMyOrders);
router.get("/orders/:id", authMiddleware, getOrderById);
router.put("/orders/:id/cancel", authMiddleware, cancelOrder);

// Reviews (Protected)
router.post("/reviews/:productId", authMiddleware, createReview);

// Payments (Protected)
router.post("/payment/create-order", authMiddleware, createPaymentOrder);
router.post("/payment/verify", authMiddleware, verifyPayment);

export default router;
