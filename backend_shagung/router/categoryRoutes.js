import express from "express";
import {
  getCategoriesWithSub,
  getMainCategories,
  getSubcategories,
  createCategory,
  createSubcategory,
  updateCategory,
  deleteCategory,
  getMainCategoriesAdmin,
  getAllCategoriesAdmin,
} from "../controller/categoryController.js";
import { PermissionAdmin } from "../middleware/auth.js";
import { cacheMiddleware } from "../middleware/cache.js";

const category_router = express.Router();

// Admin category endpoints (must be before public to avoid conflicts)
category_router.get("/admin/all", PermissionAdmin, getAllCategoriesAdmin);
category_router.get("/admin/main", PermissionAdmin, getMainCategoriesAdmin);

// Public category endpoints with caching (1 hour = 3600 seconds)
category_router.get("/", cacheMiddleware(3600), getCategoriesWithSub);
category_router.get("/main", cacheMiddleware(3600), getMainCategories);
category_router.get("/sub/:parentId", getSubcategories);

// Admin CRUD endpoints
category_router.post("/", PermissionAdmin, createCategory);
category_router.post("/sub", PermissionAdmin, createSubcategory);
category_router.put("/:id", PermissionAdmin, updateCategory);
category_router.delete("/:id", PermissionAdmin, deleteCategory);

export default category_router;

