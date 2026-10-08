import express from "express";
import {
    // Public endpoints
    getHeroSlides,
    getHeroSettings,
    // Admin endpoints - Slides
    getAllHeroSlidesAdmin,
    createHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    toggleHeroSlide,
    // Admin endpoints - Settings
    getAllHeroSettingsAdmin,
    upsertHeroSetting,
    bulkUpdateHeroSettings,
} from "../controller/heroController.js";
import { PermissionAdmin } from "../middleware/auth.js";
import { cacheMiddleware } from "../middleware/cache.js";

const heroRouter = express.Router();

// =============================================================================
// PUBLIC ENDPOINTS (with caching)
// =============================================================================

// Get active hero slides
heroRouter.get("/slides", cacheMiddleware(3600), getHeroSlides);

// Get hero settings (colors, backgrounds, etc.)
heroRouter.get("/settings", cacheMiddleware(3600), getHeroSettings);

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

// Get all slides (including inactive)
heroRouter.get("/admin/slides", PermissionAdmin, getAllHeroSlidesAdmin);

// Create new slide
heroRouter.post("/slides", PermissionAdmin, createHeroSlide);

// Update slide
heroRouter.put("/slides/:id", PermissionAdmin, updateHeroSlide);

// Delete slide
heroRouter.delete("/slides/:id", PermissionAdmin, deleteHeroSlide);

// Reorder slides
heroRouter.put("/slides/reorder", PermissionAdmin, reorderHeroSlides);

// Toggle slide active status
heroRouter.patch("/slides/:id/toggle", PermissionAdmin, toggleHeroSlide);

// Get all settings (admin)
heroRouter.get("/admin/settings", PermissionAdmin, getAllHeroSettingsAdmin);

// Update single setting
heroRouter.put("/settings/:key", PermissionAdmin, upsertHeroSetting);

// Bulk update settings
heroRouter.put("/settings", PermissionAdmin, bulkUpdateHeroSettings);

export default heroRouter;
