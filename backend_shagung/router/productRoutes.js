import express from "express";
import {
  getProductsByCategory,
  getProductsBySubcategory,
  getProductFullDetail,
  deleteProduct,
  createProduct,
  createProductVariant,
  createProductImage,
  deleteProductVariant,
  deleteProductImage,
  setPrimaryImage,
  updateImagePositions,
  deleteProductReview,
  createProductReview,
  getProductReviews,
  updateProduct,
  updateProductVariant,
  updateProductImage,
  getAllProducts,
  getAllProductsAdmin,
  searchProducts,
  getFeaturedProducts,
  getRelatedProducts,
  // Related Products Admin Functions
  getRelatedProductsAdmin,
  addRelatedProduct,
  addMultipleRelatedProducts,
  updateRelatedProductOrder,
  removeRelatedProduct,
  clearRelatedProducts,
} from "../controller/productController.js";
import { PermissionAdmin, RequireAuth } from "../middleware/auth.js";
import { cacheMiddleware } from "../middleware/cache.js";
import { CacheTTL } from "../utils/cacheService.js";
import multer from "multer";

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

const productRouter = express.Router();

// =============================================================================
// PUBLIC PRODUCT ENDPOINTS (with caching)
// =============================================================================

// Get all products with pagination & filtering
productRouter.get("/", cacheMiddleware(3600), getAllProducts);

// Search products
productRouter.get("/search", cacheMiddleware(900), searchProducts);

// Get featured products for homepage (static route - BEFORE :id)
productRouter.get("/featured", cacheMiddleware(3600), getFeaturedProducts);

// Get products by main category
productRouter.get("/category", cacheMiddleware(3600), getProductsByCategory);

// Get products by subcategory
productRouter.get("/category/:categoryId", cacheMiddleware(3600), getProductsBySubcategory);

// Admin: Get all products (including unpublished) - MUST be before /:id
productRouter.get("/admin/all", PermissionAdmin, getAllProductsAdmin);

// Get related products (same category) - BEFORE single /:id
productRouter.get("/:id/related", cacheMiddleware(3600), getRelatedProducts);

// Get product reviews (public) - BEFORE single /:id
productRouter.get("/:id/reviews", cacheMiddleware(900), getProductReviews);

// Get single product full detail - LAST among public GET /:id routes
productRouter.get("/:id", cacheMiddleware(3600), getProductFullDetail);

// =============================================================================
// AUTHENTICATED USER ENDPOINTS
// =============================================================================

// Create product review (authenticated user) - multer handled in controller
productRouter.post("/:id/review", RequireAuth, createProductReview);

// =============================================================================
// ADMIN PRODUCT ENDPOINTS
// =============================================================================

// Product CRUD
productRouter.post("/", PermissionAdmin, createProduct);
productRouter.put("/:id", PermissionAdmin, updateProduct);
productRouter.delete("/:id", PermissionAdmin, deleteProduct);

// Product variants
productRouter.post("/variant", PermissionAdmin, createProductVariant);
productRouter.put("/variant/:id", PermissionAdmin, updateProductVariant);
productRouter.delete("/variant/:id", PermissionAdmin, deleteProductVariant);

// Product images - Auth FIRST, then multer upload
productRouter.post("/image", PermissionAdmin, upload.array('images', 10), createProductImage);
productRouter.put("/image/:id", PermissionAdmin, upload.array('images', 10), updateProductImage);
productRouter.delete("/image/:id", PermissionAdmin, deleteProductImage);

// Set primary image (thumbnail) for a product
productRouter.patch("/image/:id/primary", PermissionAdmin, setPrimaryImage);

// Update image positions (drag-and-drop reorder)
productRouter.put("/images/positions", PermissionAdmin, updateImagePositions);

// Product reviews (admin)
productRouter.delete("/review/:id", PermissionAdmin, deleteProductReview);

// =============================================================================
// RELATED PRODUCTS MANAGEMENT (Admin)
// =============================================================================

// Get related products for a product (admin view with full details)
productRouter.get("/:id/related/admin", PermissionAdmin, getRelatedProductsAdmin);

// Add a single related product
productRouter.post("/:id/related", PermissionAdmin, addRelatedProduct);

// Add multiple related products at once
productRouter.post("/:id/related/bulk", PermissionAdmin, addMultipleRelatedProducts);

// Update the order of related products
productRouter.put("/:id/related/order", PermissionAdmin, updateRelatedProductOrder);

// Remove a specific related product
productRouter.delete("/:id/related/:relatedId", PermissionAdmin, removeRelatedProduct);

// Clear all related products for a product
productRouter.delete("/:id/related", PermissionAdmin, clearRelatedProducts);

export default productRouter;

