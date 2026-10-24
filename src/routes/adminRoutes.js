import express from "express";
import { AddCategory, UpdateCategory, DeleteCategory } from "../controllers/admin/categoryController.js";
import { AddProduct, UpdateProduct, DeleteProduct, GetAllProducts } from "../controllers/admin/ProductController.js";
import {
    getDashboardStats,
    getAllOrders,
    updateOrderStatus,
    getAllUsers,
    updateUserStatus,
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getAllReviews,
    deleteReview
} from "../controllers/admin/adminManagementController.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { uploadSingleImage, uploadMultipleImages } from "../controllers/admin/uploadController.js";

const router = express.Router();

// Products
router.get("/products", GetAllProducts);
router.post("/addProduct", AddProduct);
router.put("/updateProduct/:id", UpdateProduct);
router.delete("/deleteProduct/:id", DeleteProduct);

// Categories
router.post("/addCategory", AddCategory);
router.put("/updateCategory/:id", UpdateCategory);
router.delete("/deleteCategory/:id", DeleteCategory);

// Uploads
router.post("/upload", upload.single("image"), uploadSingleImage);
router.post("/upload/multiple", upload.array("images", 8), uploadMultipleImages);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Orders
router.get("/orders", getAllOrders);
router.put("/orders/:id", updateOrderStatus);

// Users
router.get("/users", getAllUsers);
router.put("/users/:id/status", updateUserStatus);

// Coupons
router.get("/coupons", getAllCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

// Reviews
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReview);

export default router;
