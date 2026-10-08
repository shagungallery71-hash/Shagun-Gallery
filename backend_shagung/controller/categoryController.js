import pool from "../config/dbconfig.js";
import {
  invalidateCategoryCache,
  cacheGet,
  cacheSet,
  CacheKeys,
  CacheTTL,
  getOrSet
} from "../utils/cacheService.js";

// =============================================================================
// PUBLIC ENDPOINTS (with caching)
// =============================================================================

// Get all categories with subcategories and products
export const getCategoriesWithSub = async (req, res) => {
  try {
    const cacheKey = CacheKeys.allCategories();

    // Try cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      // Add cache: true flag to indicate data came from cache
      return res.json({ data: cached, cache: true });
    }

    const result = await pool.query(`
      SELECT
        c1.id AS category_id,
        c1.name AS category,
        c2.id AS subcategory_id,
        c2.name AS subcategory,
        p.id AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        p.price AS product_price,
        p.is_published AS product_published
      FROM categories c1
      LEFT JOIN categories c2 ON c2.parent_id = c1.id
      LEFT JOIN products p ON p.category_id = c1.id
      ORDER BY c1.name, c2.name, p.name;
    `);

    const data = result.rows;

    // Cache for 5 minutes
    await cacheSet(cacheKey, data, CacheTTL.MEDIUM);

    res.json({ data, cache: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get main categories (public - active only)
export const getMainCategories = async (req, res) => {
  try {
    const cacheKey = CacheKeys.mainCategories();
    const skipCache = req.query.nocache === 'true';

    if (!skipCache) {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        // Add cache: true flag to indicate data came from cache
        return res.json({ data: cached, cache: true });
      }
    }

    // Query with product count (includes products from subcategories)
    const result = await pool.query(`
      SELECT 
        c.*,
        (
          SELECT COUNT(*) 
          FROM products p 
          WHERE p.is_published = true 
          AND (
            p.category_id = c.id 
            OR p.category_id IN (SELECT id FROM categories WHERE parent_id = c.id)
          )
        ) as product_count
      FROM categories c
      WHERE c.parent_id IS NULL AND c.is_active = true 
      ORDER BY c.name;
    `);

    const data = result.rows;
    await cacheSet(cacheKey, data, CacheTTL.LONG); // Cache for 1 hour

    res.json({ data, cache: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================================================
// ADMIN ENDPOINTS (no caching for admin views, but invalidate on mutations)
// =============================================================================

// Get all main categories (admin - including inactive)
export const getMainCategoriesAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name;
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all categories with subcategories (admin - including inactive)
export const getAllCategoriesAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as product_count
      FROM categories c 
      ORDER BY c.parent_id NULLS FIRST, c.name;
    `);
    res.json({ categories: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get subcategories and products by category ID
export const getSubcategories = async (req, res) => {
  const { parentId } = req.params;
  try {
    const cacheKey = CacheKeys.categoryWithSubs(parentId);

    const cached = await cacheGet(cacheKey);
    if (cached) {
      // Add cache: true flag to indicate data came from cache
      return res.json({ ...cached, cache: true });
    }

    // Get subcategories
    const subcategoriesResult = await pool.query(
      `SELECT * FROM categories WHERE parent_id = $1 AND is_active = true`,
      [parentId]
    );

    // Get products in this category with SALE PRICE calculation
    const productsResult = await pool.query(`
      SELECT
        p.*,
        c.name AS category_name,
        -- Calculate sale_price if active sale exists
        COALESCE(
          (SELECT ROUND(p.price - (p.price * s.discount_percentage / 100), 2)
           FROM product_sales ps
           JOIN sales s ON ps.sale_id = s.id
           WHERE ps.product_id = p.id
             AND s.is_active = true
             AND s.start_date <= NOW()
             AND s.end_date >= NOW()
           ORDER BY s.priority ASC
           LIMIT 1),
          p.price
        ) as sale_price,
        -- Check if on sale
        EXISTS (
           SELECT 1
           FROM product_sales ps
           JOIN sales s ON ps.sale_id = s.id
           WHERE ps.product_id = p.id
             AND s.is_active = true
             AND s.start_date <= NOW()
             AND s.end_date >= NOW()
        ) as on_sale,
        -- Get sale badge text
        (
           SELECT s.badge_text
           FROM product_sales ps
           JOIN sales s ON ps.sale_id = s.id
           WHERE ps.product_id = p.id
             AND s.is_active = true
             AND s.start_date <= NOW()
             AND s.end_date >= NOW()
           ORDER BY s.priority ASC
           LIMIT 1
        ) as badge_text,
        -- Get sale discount
        (
           SELECT s.discount_percentage
           FROM product_sales ps
           JOIN sales s ON ps.sale_id = s.id
           WHERE ps.product_id = p.id
             AND s.is_active = true
             AND s.start_date <= NOW()
             AND s.end_date >= NOW()
           ORDER BY s.priority ASC
           LIMIT 1
        ) as sale_discount
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = $1
      ORDER BY p.created_at DESC;
    `, [parentId]);

    // Combine results
    const response = {
      subcategories: subcategoriesResult.rows,
      products: productsResult.rows,
      category_id: parentId
    };

    if (productsResult.rows.length > 0) {
      const p1 = productsResult.rows.find(p => p.id === 182) || productsResult.rows[0];
      console.log(`[DEBUG] getSubcategories Product ${p1.id}: sale_price=${p1.sale_price}, on_sale=${p1.on_sale}`);
    }

    // await cacheSet(cacheKey, response, CacheTTL.MEDIUM); // Disable manual cache set too

    res.json({ ...response, cache: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================================================
// ADMIN MUTATION ENDPOINTS (invalidate cache after changes)
// =============================================================================

// Admin: create main category
export const createCategory = async (req, res) => {
  const { name, slug, is_active = true, image_url, category_image } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: "name and slug are required" });
  }

  // Fallback logic: if one image is provided, populate the other
  const finalImageUrl = image_url || category_image || null;
  const finalCategoryImage = category_image || image_url || null;

  try {
    const result = await pool.query(
      `
      INSERT INTO categories (name, slug, parent_id, is_active, image_url, category_image)
      VALUES ($1, $2, NULL, $3, $4, $5)
      RETURNING *;
      `,
      [name, slug, is_active, finalImageUrl, finalCategoryImage]
    );

    await invalidateCategoryCache();

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: create subcategory under a main category
export const createSubcategory = async (req, res) => {
  const { name, slug, parent_id, is_active = true, image_url, category_image } = req.body;

  if (!name || !slug || !parent_id) {
    return res.status(400).json({ error: "name, slug and parent_id are required" });
  }

  // Fallback logic
  const finalImageUrl = image_url || category_image || null;
  const finalCategoryImage = category_image || image_url || null;

  try {
    const parentCheck = await pool.query(
      `SELECT id FROM categories WHERE id = $1 AND parent_id IS NULL`,
      [parent_id]
    );

    if (parentCheck.rows.length === 0) {
      return res.status(400).json({ error: "Valid main parent category not found" });
    }

    const result = await pool.query(
      `
      INSERT INTO categories (name, slug, parent_id, is_active, image_url, category_image)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [name, slug, parent_id, is_active, finalImageUrl, finalCategoryImage]
    );

    await invalidateCategoryCache();

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: update category (main or sub)
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, parent_id, is_active, image_url, category_image } = req.body;

  // No check for empty body because we might just be updating one field, but strict check is okay
  if (!name && !slug && parent_id === undefined && is_active === undefined && !image_url && !category_image) {
    return res.status(400).json({ error: "At least one field must be provided to update" });
  }

  // Smart update logic for images
  // We cannot simply fallback because we don't know if the user INTENDED to leave one null (unchanged) while updating the other.
  // BUT the user specifically asked for "category_image or image me same image jaay".
  // So if the user sends one, we should probably update BOTH if the other is not sent.
  // However, for update, we must rely on what is passed.

  // Strategy:
  // If `image_url` is passed but `category_image` is NOT passed -> update both to `image_url`
  // If `category_image` is passed but `image_url` is NOT passed -> update both `category_image`
  // If BOTH are passed -> use respective values.

  let targetImageUrl = image_url;
  let targetCategoryImage = category_image;

  if (image_url !== undefined && category_image === undefined) {
    targetCategoryImage = image_url;
  } else if (category_image !== undefined && image_url === undefined) {
    targetImageUrl = category_image;
  }

  try {
    const result = await pool.query(
      `
      UPDATE categories
      SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        parent_id = COALESCE($3, parent_id),
        is_active = COALESCE($4, is_active),
        image_url = COALESCE($5, image_url),
        category_image = COALESCE($6, category_image)
      WHERE id = $7
      RETURNING *;
      `,
      [
        name || null,
        slug || null,
        parent_id ?? null,
        is_active ?? null,
        targetImageUrl || null,
        targetCategoryImage || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    await invalidateCategoryCache();

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete category (admin)
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);

    // Invalidate category cache after deletion
    await invalidateCategoryCache();

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
