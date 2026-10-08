import pool from "../config/dbconfig.js";
import { cacheGet, cacheSet, cacheDel, CacheTTL } from "../utils/cacheService.js";

// Cache keys
const HERO_CACHE_KEY = "hero:slides:all";
const HERO_SETTINGS_KEY = "hero:settings";

// =============================================================================
// PUBLIC ENDPOINTS
// =============================================================================

/**
 * Get all active hero slides (public)
 * GET /api/hero/slides
 * Query params: ?fresh=true to bypass cache
 */
export const getHeroSlides = async (req, res) => {
    try {
        const bypassCache = req.query.fresh === 'true';

        // Try cache first (unless bypassing)
        if (!bypassCache) {
            const cached = await cacheGet(HERO_CACHE_KEY);
            if (cached && Array.isArray(cached) && cached.length > 0) {
                return res.json({
                    success: true,
                    data: cached,
                    cached: true
                });
            }
        }

        // Get active slides ordered by position
        const result = await pool.query(`
            SELECT 
                id,
                title,
                subtitle,
                description,
                image_url,
                badge_text,
                gradient,
                button_text,
                button_link,
                secondary_button_text,
                secondary_button_link,
                starting_price,
                price_label,
                position,
                is_active,
                created_at
            FROM hero_slides 
            WHERE is_active = true 
            ORDER BY position ASC
        `);

        // Only cache if we have data
        if (result.rows.length > 0) {
            await cacheSet(HERO_CACHE_KEY, result.rows, CacheTTL.LONG);
        }

        res.json({
            success: true,
            data: result.rows,
            cached: false
        });
    } catch (error) {
        console.error("Error fetching hero slides:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch hero slides"
        });
    }
};

/**
 * Get hero section settings (colors, backgrounds)
 * GET /api/hero/settings
 * Query params: ?fresh=true to bypass cache
 */
export const getHeroSettings = async (req, res) => {
    try {
        const bypassCache = req.query.fresh === 'true';

        // Try cache first (unless bypassing)
        if (!bypassCache) {
            const cached = await cacheGet(HERO_SETTINGS_KEY);
            if (cached && Object.keys(cached).length > 0) {
                return res.json({
                    success: true,
                    data: cached,
                    cached: true
                });
            }
        }

        const result = await pool.query(`
            SELECT 
                id,
                setting_key,
                setting_value,
                setting_type,
                description,
                updated_at
            FROM hero_settings
        `);

        // Convert to key-value object
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = {
                value: row.setting_value,
                type: row.setting_type,
                description: row.description
            };
        });

        // Only cache if we have data
        if (Object.keys(settings).length > 0) {
            await cacheSet(HERO_SETTINGS_KEY, settings, CacheTTL.LONG);
        }

        res.json({
            success: true,
            data: settings,
            cached: false
        });
    } catch (error) {
        console.error("Error fetching hero settings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch hero settings"
        });
    }
};

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

/**
 * Get all hero slides (admin - including inactive)
 * GET /api/hero/admin/slides
 */
export const getAllHeroSlidesAdmin = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                title,
                subtitle,
                description,
                image_url,
                badge_text,
                gradient,
                button_text,
                button_link,
                secondary_button_text,
                secondary_button_link,
                starting_price,
                price_label,
                position,
                is_active,
                created_at,
                updated_at
            FROM hero_slides 
            ORDER BY position ASC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error("Error fetching admin hero slides:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch hero slides"
        });
    }
};

/**
 * Create a new hero slide
 * POST /api/hero/slides
 */
export const createHeroSlide = async (req, res) => {
    try {
        const {
            title,
            subtitle,
            description,
            image_url,
            badge_text,
            gradient = 'from-rose-600 via-pink-500 to-fuchsia-500',
            button_text = 'Shop Now',
            button_link = '/products',
            secondary_button_text,
            secondary_button_link,
            starting_price,
            price_label = 'Starting from',
            is_active = true
        } = req.body;

        // Get max position
        const posResult = await pool.query('SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM hero_slides');
        const position = posResult.rows[0].next_pos;

        const result = await pool.query(`
            INSERT INTO hero_slides (
                title, subtitle, description, image_url, badge_text, gradient,
                button_text, button_link, secondary_button_text, secondary_button_link,
                starting_price, price_label, position, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `, [
            title, subtitle, description, image_url, badge_text, gradient,
            button_text, button_link, secondary_button_text, secondary_button_link,
            starting_price, price_label, position, is_active
        ]);

        // Invalidate cache
        await invalidateHeroCache();

        res.status(201).json({
            success: true,
            message: "Hero slide created successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating hero slide:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create hero slide"
        });
    }
};

/**
 * Update a hero slide
 * PUT /api/hero/slides/:id
 */
export const updateHeroSlide = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            subtitle,
            description,
            image_url,
            badge_text,
            gradient,
            button_text,
            button_link,
            secondary_button_text,
            secondary_button_link,
            starting_price,
            price_label,
            is_active
        } = req.body;

        const result = await pool.query(`
            UPDATE hero_slides SET
                title = COALESCE($1, title),
                subtitle = COALESCE($2, subtitle),
                description = COALESCE($3, description),
                image_url = COALESCE($4, image_url),
                badge_text = COALESCE($5, badge_text),
                gradient = COALESCE($6, gradient),
                button_text = COALESCE($7, button_text),
                button_link = COALESCE($8, button_link),
                secondary_button_text = COALESCE($9, secondary_button_text),
                secondary_button_link = COALESCE($10, secondary_button_link),
                starting_price = COALESCE($11, starting_price),
                price_label = COALESCE($12, price_label),
                is_active = COALESCE($13, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $14
            RETURNING *
        `, [
            title, subtitle, description, image_url, badge_text, gradient,
            button_text, button_link, secondary_button_text, secondary_button_link,
            starting_price, price_label, is_active, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Hero slide not found"
            });
        }

        // Invalidate cache
        await invalidateHeroCache();

        res.json({
            success: true,
            message: "Hero slide updated successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating hero slide:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update hero slide"
        });
    }
};

/**
 * Delete a hero slide
 * DELETE /api/hero/slides/:id
 */
export const deleteHeroSlide = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM hero_slides WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Hero slide not found"
            });
        }

        // Reorder remaining slides
        await pool.query(`
            WITH ordered AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY position) as new_pos
                FROM hero_slides
            )
            UPDATE hero_slides SET position = ordered.new_pos
            FROM ordered WHERE hero_slides.id = ordered.id
        `);

        // Invalidate cache
        await invalidateHeroCache();

        res.json({
            success: true,
            message: "Hero slide deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting hero slide:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete hero slide"
        });
    }
};

/**
 * Reorder hero slides
 * PUT /api/hero/slides/reorder
 */
export const reorderHeroSlides = async (req, res) => {
    try {
        const { slideIds } = req.body; // Array of slide IDs in desired order

        if (!Array.isArray(slideIds)) {
            return res.status(400).json({
                success: false,
                message: "slideIds must be an array"
            });
        }

        // Update positions
        for (let i = 0; i < slideIds.length; i++) {
            await pool.query(
                'UPDATE hero_slides SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [i + 1, slideIds[i]]
            );
        }

        // Invalidate cache
        await invalidateHeroCache();

        res.json({
            success: true,
            message: "Hero slides reordered successfully"
        });
    } catch (error) {
        console.error("Error reordering hero slides:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reorder hero slides"
        });
    }
};

/**
 * Toggle hero slide active status
 * PATCH /api/hero/slides/:id/toggle
 */
export const toggleHeroSlide = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE hero_slides 
            SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Hero slide not found"
            });
        }

        // Invalidate cache
        await invalidateHeroCache();

        res.json({
            success: true,
            message: `Hero slide ${result.rows[0].is_active ? 'activated' : 'deactivated'}`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error toggling hero slide:", error);
        res.status(500).json({
            success: false,
            message: "Failed to toggle hero slide"
        });
    }
};

// =============================================================================
// HERO SETTINGS (Colors, Backgrounds, etc.)
// =============================================================================

/**
 * Get all hero settings (admin)
 * GET /api/hero/admin/settings
 */
export const getAllHeroSettingsAdmin = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM hero_settings ORDER BY setting_key
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error("Error fetching hero settings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch hero settings"
        });
    }
};

/**
 * Update or create a hero setting
 * PUT /api/hero/settings/:key
 */
export const upsertHeroSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value, type = 'string', description } = req.body;

        const result = await pool.query(`
            INSERT INTO hero_settings (setting_key, setting_value, setting_type, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (setting_key) 
            DO UPDATE SET 
                setting_value = $2, 
                setting_type = $3, 
                description = COALESCE($4, hero_settings.description),
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [key, value, type, description]);

        // Invalidate all hero cache
        await invalidateHeroCache();

        res.json({
            success: true,
            message: "Setting updated successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating hero setting:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update hero setting"
        });
    }
};

/**
 * Bulk update hero settings
 * PUT /api/hero/settings
 */
export const bulkUpdateHeroSettings = async (req, res) => {
    try {
        const { settings } = req.body; // Array of { key, value, type, description }

        if (!Array.isArray(settings)) {
            return res.status(400).json({
                success: false,
                message: "settings must be an array"
            });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const setting of settings) {
                await client.query(`
                    INSERT INTO hero_settings (setting_key, setting_value, setting_type, description)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (setting_key) 
                    DO UPDATE SET 
                        setting_value = $2, 
                        setting_type = $3, 
                        description = COALESCE($4, hero_settings.description),
                        updated_at = CURRENT_TIMESTAMP
                `, [setting.key, setting.value, setting.type || 'string', setting.description]);
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        // Invalidate all hero cache
        await invalidateHeroCache();

        res.json({
            success: true,
            message: "Settings updated successfully"
        });
    } catch (error) {
        console.error("Error bulk updating hero settings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update hero settings"
        });
    }
};

// =============================================================================
// CACHE HELPERS
// =============================================================================

async function invalidateHeroCache() {
    try {
        // Clear controller-level cache
        await cacheDel(HERO_CACHE_KEY);
        await cacheDel(HERO_SETTINGS_KEY);

        // Also clear middleware-level cache (uses different keys)
        await cacheDel('api:/api/hero/slides');
        await cacheDel('api:/api/hero/settings');

        console.log('🗑️ Hero cache invalidated (all layers)');
    } catch (error) {
        console.warn('⚠️ Failed to invalidate hero cache:', error.message);
    }
}
