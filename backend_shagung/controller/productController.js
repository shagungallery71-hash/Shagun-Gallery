import pool from "../config/dbconfig.js";
import cloudinary from "../config/cloudnary.js";
import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import {
  invalidateProductCache,
  invalidateReviewCache,
  cacheGet,
  cacheSet,
  CacheKeys,
  CacheTTL
} from "../utils/cacheService.js";
import { publishCacheInvalidation } from "../utils/cachePublisher.js";

// Use memory storage for Cloudinary uploads (files will be in buffer)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Helper function to upload buffer to Cloudinary using upload_stream
const uploadToCloudinary = (buffer, mimetype, folder = 'products') => {
  return new Promise((resolve, reject) => {
    // Use upload_stream for better memory efficiency
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        timeout: 60000, // 60 second timeout
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error.message);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Write buffer to the stream
    uploadStream.end(buffer);
  });
};

// Get products by main category (parent NULL)
export const getProductsByCategory = async (req, res) => {

  try {
    const result = await pool.query(`
      SELECT p.*, c.name AS category 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE c.parent_id IS NULL;
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Admin: create product (basic product only)
export const createProduct = async (req, res) => {
  console.log("Creating Product");
  try {
    const {
      category_id,
      name,
      slug,
      description = "",
      detail_description = {},
      fabric = {},
      shipping = {},
      faq = [],
      price,
      compare_at_price,
      cost_price,
      stock = 0,
      sku,
      is_published = false,
      is_featured = false,
      is_new = false,
      tags = [],
      meta_title,
      meta_description,
      return_policy,
      brand_by,
      gst_included = true,
      gst_rate = null
    } = req.body;

    // Required fields
    if (!category_id || !name || !slug || price == null) {
      return res
        .status(400)
        .json({ error: "category_id, name, slug and price are required" });
    }

    // Check category exists
    const categoryCheck = await pool.query(
      "SELECT id FROM categories WHERE id = $1",
      [category_id]
    );
    if (categoryCheck.rowCount === 0) {
      return res.status(400).json({ error: "Invalid category_id" });
    }

    // Ensure slug unique
    let finalSlug = slug;
    const slugCheck = await pool.query(
      "SELECT id FROM products WHERE slug = $1",
      [slug]
    );
    if (slugCheck.rowCount > 0) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const result = await pool.query(
      `
      INSERT INTO products (
        category_id,
        name,
        slug,
        description,
        detail_description,
        fabric,
        shipping,
        faq,
        price,
        compare_at_price,
        cost_price,
        stock,
        sku,
        is_published,
        is_featured,
        is_new,
        tags,
        meta_title,
        meta_description,
        return_policy,
        brand_by,
        gst_included,
        gst_rate
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      RETURNING *;
      `,
      [
        category_id,
        name,
        finalSlug,
        description,
        JSON.stringify(detail_description),
        JSON.stringify(fabric),
        JSON.stringify(shipping),
        JSON.stringify(faq),
        price,
        compare_at_price || null,
        cost_price || null,
        stock,
        sku || null,
        is_published,
        is_featured,
        is_new,
        tags && tags.length > 0 ? tags : null,
        meta_title || null,
        meta_description || null,
        return_policy || '7-day easy returns',
        brand_by || 'shagungallery',
        gst_included !== false,
        gst_rate || null
      ]
    );

    // Invalidate product cache after creation
    await invalidateProductCache();

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    // Friendly slug duplicate error message
    if (error.code === "23505" && error.constraint === "products_slug_key") {
      return res.status(400).json({ error: "Slug must be unique" });
    }

    res.status(500).json({ error: error.message });
  }
};





// Admin: create product variant
export const createProductVariant = async (req, res) => {
  const { product_id, size, color, color_code, price, stock } = req.body;

  if (!product_id || !size || !stock || price == null) {
    return res.status(400).json({ error: "product_id, size , price and stock are required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO product_variants (product_id, size, color, color_code, price, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [product_id, size, color || null, color_code || null, price, stock]
    );

    // Invalidate product cache after variant creation
    await invalidateProductCache(product_id);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: create product image (Cloudinary upload)
export const createProductImage = async (req, res) => {
  console.log("-----------------------------------------");
  console.log("START: createProductImage");
  console.log("Files count:", req.files?.length);
  console.log("Body:", req.body);

  // Multer middleware in route handles the upload (memory storage)
  const { product_id, is_primary = false, position = 0, color = null, color_code = null } = req.body;

  if (!product_id) {
    console.error("❌ Missing product_id");
    return res.status(400).json({ error: "product_id is required" });
  }

  if (!req.files || req.files.length === 0) {
    console.error("❌ No files uploaded");
    return res.status(400).json({ error: "No images provided" });
  }

  // Limit max files per request to prevent overload
  const MAX_FILES = 10;
  if (req.files.length > MAX_FILES) {
    return res.status(400).json({ error: `Maximum ${MAX_FILES} images per upload. You tried to upload ${req.files.length}.` });
  }

  try {
    // Fetch product details including slug for folder organization
    const productCheck = await pool.query(
      'SELECT id, slug, name FROM products WHERE id = $1',
      [product_id]
    );
    if (productCheck.rows.length === 0) {
      console.error(`❌ Product ${product_id} not found`);
      return res.status(404).json({ error: "Product not found" });
    }

    const product = productCheck.rows[0];
    // Create folder path: products/product-slug (sanitize slug for safety)
    const sanitizedSlug = (product.slug || product.name || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')  // Replace special chars with hyphen
      .replace(/-+/g, '-')           // Replace multiple hyphens with single
      .substring(0, 50);             // Limit length
    const cloudinaryFolder = `products/${sanitizedSlug}`;
    console.log(`📁 Uploading to Cloudinary folder: ${cloudinaryFolder}`);

    const dbResults = [];
    let currentPosition = parseInt(position) || 0;

    // Upload images in parallel (batches of 3 for performance)
    const BATCH_SIZE = 3;
    const files = [...req.files];

    console.log(`Processing ${files.length} files in batches of ${BATCH_SIZE}`);

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(files.length / BATCH_SIZE)}`);

      const uploadPromises = batch.map(async (file, idx) => {
        console.log(`Uploading file: ${file.originalname} (${file.mimetype})`);

        try {
          // Check if file is on disk (file.path) or in memory (file.buffer)
          let imageUrl;

          if (file.path) {
            // Disk Storage
            console.log(`Uploading from disk: ${file.path}`);
            const result = await cloudinary.uploader.upload(file.path, {
              folder: cloudinaryFolder,
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
              ]
            });
            imageUrl = result.secure_url;

            // Delete local file
            fs.unlink(file.path, (err) => {
              if (err) console.error("Failed to delete local product file:", err);
            });
          } else if (file.buffer) {
            // Memory Storage - use dynamic folder path
            const result = await uploadToCloudinary(file.buffer, file.mimetype, cloudinaryFolder);
            imageUrl = result.secure_url;
          } else {
            throw new Error("No file buffer or path found");
          }

          console.log(`✅ Uploaded to Cloudinary: ${imageUrl}`);

          // Save to database with color info
          const dbResult = await pool.query(
            `INSERT INTO product_images (product_id, image_url, is_primary, position, color, color_code)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *;`,
            [product_id, imageUrl, is_primary === 'true' || is_primary === true, currentPosition + i + idx, color || null, color_code || null]
          );
          console.log(`✅ Saved to DB: Image ID ${dbResult.rows[0].id}`);
          return dbResult.rows[0];
        } catch (err) {
          console.error(`❌ Error uploading file ${file.originalname}:`, err.message);
          throw err;
        }
      });

      const batchResults = await Promise.all(uploadPromises);
      dbResults.push(...batchResults);
    }

    // Invalidate product cache after image upload
    await invalidateProductCache(product_id);
    console.log("✅ Cache invalidated for product:", product_id);

    console.log(`Successfully completed upload of ${dbResults.length} images`);
    res.status(201).json({ success: true, data: dbResults });
  } catch (error) {
    console.error("❌ createProductImage FATAL error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Admin: update product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    category_id,
    name,
    slug,
    description,
    detail_description,
    fabric,
    shipping,
    faq,
    price,
    compare_at_price,
    cost_price,
    stock,
    sku,
    is_published,
    is_featured,
    is_new,
    tags,
    meta_title,
    meta_description,
    return_policy,
    brand_by,
    gst_included,
    gst_rate
  } = req.body;

  if (!category_id || !name || !slug || price == null) {
    return res.status(400).json({
      error: "category_id, name, slug and price are required",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE products
      SET category_id = $1,
          name = $2,
          slug = $3,
          description = $4,
          detail_description = $5,
          fabric = $6,
          shipping = $7,
          faq = $8,
          price = $9,
          compare_at_price = $10,
          cost_price = $11,
          stock = $12,
          sku = $13,
          is_published = $14,
          is_featured = $15,
          is_new = $16,
          tags = $17,
          meta_title = $18,
          meta_description = $19,
          return_policy = $20,
          brand_by = $21,
          gst_included = $22,
          gst_rate = $23,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $24
      RETURNING *;
      `,
      [
        category_id,
        name,
        slug,
        description || null,
        detail_description ? JSON.stringify(detail_description) : null,
        fabric ? JSON.stringify(fabric) : null,
        shipping ? JSON.stringify(shipping) : null,
        faq ? JSON.stringify(faq) : null,
        price,
        compare_at_price || null,
        cost_price || null,
        stock ?? 0,
        sku || null,
        is_published ?? false,
        is_featured ?? false,
        is_new ?? false,
        tags && tags.length > 0 ? tags : null,
        meta_title || null,
        meta_description || null,
        return_policy || null,
        brand_by || 'shagungallery',
        gst_included !== false,
        gst_rate || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Invalidate product cache after update
    await invalidateProductCache(id);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Admin: update product variant
export const updateProductVariant = async (req, res) => {
  const { id } = req.params;
  const { product_id, size, color, color_code, price, stock } = req.body;

  if (!product_id || !size || price == null) {
    return res.status(400).json({ error: "product_id, size and price are required" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE product_variants
      SET product_id = $1,
          size = $2,
          color = $3,
          color_code = $4,
          price = $5,
          stock = $6
      WHERE id = $7
      RETURNING *;
      `,
      [product_id, size, color || null, color_code || null, price, stock ?? 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product variant not found" });
    }

    // Invalidate product-related caches
    await invalidateProductCache(product_id);
    await publishCacheInvalidation(`cache:*products*`);
    await publishCacheInvalidation(`cache:*/api/products/${product_id}*`);
    await publishCacheInvalidation(`api:/api/products/${product_id}*`);
    await publishCacheInvalidation(`api:/api/products?*`);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: update product image
export const updateProductImage = async (req, res) => {
  // Multer middleware already processed the upload

  console.log("req.files:", req.files);
  const { id } = req.params;
  const { product_id, is_primary, position } = req.body;

  if (!product_id && !req.files) {
    return res.status(400).json({ error: "product_id or image are required" });
  }

  try {
    let imageUrls = [];
    if (req.files) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'product_images'
        });
        imageUrls.push(result.secure_url);
      }
    }

    let dbResults = [];
    // If new images are uploaded, add them
    if (imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        const dbResult = await pool.query(
          `
            UPDATE product_images
            SET product_id = $1,
                image_url = $2,
                is_primary = $3,
                position = $4
            WHERE id = $5
            RETURNING *;
            `,
          [product_id, imageUrl, is_primary ?? false, position ?? 0, id]
        );
        dbResults.push(dbResult.rows[0]);
      }
    }

    // Invalidate product-related caches (Simplified to use invalidateProductCache if available, but keeping existing calls for safety)
    await publishCacheInvalidation(`cache:*products*`);
    await publishCacheInvalidation(`cache:*/api/products/${product_id}*`);

    res.json({ success: true, data: dbResults });
  } catch (error) {
    console.error("Cloudinary error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Admin: delete product variant
export const deleteProductVariant = async (req, res) => {
  const { id } = req.params;
  try {
    // Get the product_id before deleting to invalidate the correct cache
    const variantResult = await pool.query("SELECT product_id FROM product_variants WHERE id = $1", [id]);
    const productId = variantResult.rows[0]?.product_id;

    await pool.query("DELETE FROM product_variants WHERE id = $1", [id]);

    // Invalidate product-related caches
    await publishCacheInvalidation(`cache:*products*`);
    if (productId) {
      await publishCacheInvalidation(`cache:*/api/products/${productId}*`);
    }

    res.json({ message: "Product variant deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================================================
// SET PRIMARY IMAGE (Admin) - Sets the thumbnail/primary image for a product
// =============================================================================
export const setPrimaryImage = async (req, res) => {
  const { id } = req.params; // image_id

  try {
    // 1. Get the product_id for this image
    const imageResult = await pool.query(
      'SELECT product_id FROM product_images WHERE id = $1',
      [id]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const productId = imageResult.rows[0].product_id;

    // 2. Reset all images for this product to non-primary
    await pool.query(
      'UPDATE product_images SET is_primary = false WHERE product_id = $1',
      [productId]
    );

    // 3. Set the selected image as primary
    const result = await pool.query(
      'UPDATE product_images SET is_primary = true WHERE id = $1 RETURNING *',
      [id]
    );

    // 4. Invalidate caches
    await publishCacheInvalidation(`cache:*products*`);
    await publishCacheInvalidation(`cache:*/api/products/${productId}*`);
    await publishCacheInvalidation(`cache:*/api/products?*`);

    res.json({
      success: true,
      message: 'Primary image updated successfully',
      image: result.rows[0]
    });
  } catch (error) {
    console.error('Set Primary Image Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to extract Cloudinary public_id from URL
const extractCloudinaryPublicId = (imageUrl) => {
  try {
    // Cloudinary URLs look like: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
    // We need to extract: folder/filename (without extension)
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');

    if (uploadIndex === -1) return null;

    // Get everything after 'upload' and version number (v1234567890)
    let publicIdParts = urlParts.slice(uploadIndex + 1);

    // Remove version number if present (starts with 'v' followed by digits)
    if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }

    // Join remaining parts and remove file extension
    const publicIdWithExtension = publicIdParts.join('/');
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove extension

    return publicId;
  } catch (error) {
    console.error('Error extracting Cloudinary public_id:', error);
    return null;
  }
};

// Admin: delete product image
export const deleteProductImage = async (req, res) => {
  const { id } = req.params;
  try {
    // Get image details before deleting (including image_url for Cloudinary deletion)
    const imageResult = await pool.query(
      "SELECT product_id, image_url FROM product_images WHERE id = $1",
      [id]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    const { product_id: productId, image_url: imageUrl } = imageResult.rows[0];

    // Delete from Cloudinary first
    if (imageUrl) {
      const publicId = extractCloudinaryPublicId(imageUrl);
      if (publicId) {
        try {
          console.log(`🗑️ Deleting from Cloudinary: ${publicId}`);
          const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
          console.log(`✅ Cloudinary delete result:`, cloudinaryResult);
        } catch (cloudinaryError) {
          // Log error but continue with database deletion
          console.error('⚠️ Cloudinary deletion failed (continuing with DB delete):', cloudinaryError.message);
        }
      }
    }

    // Delete from database
    await pool.query("DELETE FROM product_images WHERE id = $1", [id]);
    console.log(`✅ Image deleted from database: ID ${id}`);

    // Invalidate product-related caches (multiple methods for reliability)
    if (productId) {
      await invalidateProductCache(productId);
    }
    await invalidateProductCache();
    await publishCacheInvalidation(`cache:*products*`);
    if (productId) {
      await publishCacheInvalidation(`cache:*/api/products/${productId}*`);
    }

    res.json({ message: "Product image deleted successfully from database and Cloudinary" });
  } catch (error) {
    console.error('❌ deleteProductImage error:', error);
    res.status(500).json({ error: error.message });
  }
};

// =============================================================================
// UPDATE IMAGE POSITIONS (Admin) - Reorder product images via drag-and-drop
// =============================================================================
export const updateImagePositions = async (req, res) => {
  try {
    const { product_id, images } = req.body;
    // images is an array of { id, position, is_primary }

    if (!product_id || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: 'product_id and images array are required'
      });
    }

    // Update each image's position
    for (const img of images) {
      await pool.query(
        'UPDATE product_images SET position = $1, is_primary = $2 WHERE id = $3 AND product_id = $4',
        [img.position, img.is_primary || false, img.id, product_id]
      );
    }

    // Invalidate caches
    await publishCacheInvalidation(`cache:*products*`);
    await publishCacheInvalidation(`cache:*/api/products/${product_id}*`);
    await publishCacheInvalidation(`cache:*/api/products?*`);

    res.json({
      success: true,
      message: 'Image positions updated successfully'
    });
  } catch (error) {
    console.error('Update Image Positions Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin: delete product review
export const deleteProductReview = async (req, res) => {
  const { id } = req.params;
  try {
    // Get the product_id before deleting to invalidate the correct cache
    const reviewResult = await pool.query("SELECT product_id FROM product_reviews WHERE id = $1", [id]);
    const productId = reviewResult.rows[0]?.product_id;

    await pool.query("DELETE FROM product_reviews WHERE id = $1", [id]);

    // Invalidate product-related caches
    await publishCacheInvalidation(`cache:*products*`);
    if (productId) {
      await publishCacheInvalidation(`cache:*/api/products/${productId}*`);
    }

    res.json({ message: "Product review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create product review (authenticated user)
export const createProductReview = async (req, res) => {
  upload.array('media', 5)(req, res, async (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    const { id: productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user id missing on request",
      });
    }

    if (rating == null || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating between 1 and 5 is required",
      });
    }

    try {
      let imageUrls = [];
      let videoUrls = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const isVideo = file.mimetype.startsWith('video/');
          // Use the uploadToCloudinary helper that handles memory buffers correctly
          const result = await uploadToCloudinary(file.buffer, file.mimetype, 'review_media');

          if (isVideo) {
            videoUrls.push(result.secure_url);
          } else {
            imageUrls.push(result.secure_url);
          }
        }
      }

      const result = await pool.query(
        `
        INSERT INTO product_reviews (product_id, user_id, rating, comment, images, videos)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
        `,
        [productId, userId, rating, comment || null, JSON.stringify(imageUrls), JSON.stringify(videoUrls)]
      );

      // Invalidate product-related caches (reviews affect product detail)
      await publishCacheInvalidation(`cache:*products*`);
      await publishCacheInvalidation(`cache:*/api/products/${productId}*`);

      return res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error creating product review:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
};

// Get product reviews (paginated, for lazy loading)
export const getProductReviews = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 5 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        u.username as user_name,
        count(*) OVER() as full_count
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    const total = result.rows.length > 0 ? parseInt(result.rows[0].full_count) : 0;

    // Fallback if no rows returned but we need total (e.g. empty page), 
    // though if page 1 is empty total is 0. 
    // Better strategy: seperate count query if optimizing, but window function is fine for now or seperate count.

    // Actually, window function `count(*) OVER()` only works if there are rows. 
    // If offset is beyond range, no rows = no count info.
    // Let's use a separate count query to be safe and standard.

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM product_reviews WHERE product_id = $1
    `, [id]);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      reviews: result.rows,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductsBySubcategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    // First, check if the category exists
    const categoryCheck = await pool.query(
      'SELECT id, name, parent_id FROM categories WHERE id = $1',
      [categoryId]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = categoryCheck.rows[0];

    let result;

    if (category.parent_id === null) {
      // It's a main category - get products from this main category
      result = await pool.query(`
        SELECT 
           p.*,
           c.name as category_name,
           c.slug as category_slug,
           c.category_image as category_image,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image,
           (SELECT json_agg(image_url) FROM product_images WHERE product_id = p.id) as images,
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
            -- Get sale details for badge
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
            (
               SELECT s.name
               FROM product_sales ps
               JOIN sales s ON ps.sale_id = s.id
               WHERE ps.product_id = p.id
                 AND s.is_active = true
                 AND s.start_date <= NOW()
                 AND s.end_date >= NOW()
               ORDER BY s.priority ASC
               LIMIT 1
            ) as sale_name,
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
      `, [categoryId]);
    } else {
      // It's a subcategory
      result = await pool.query(`
        SELECT 
           p.*,
           c.name as category_name,
           c.slug as category_slug,
           sub.name as subcategory_name,
           sub.slug as subcategory_slug,
           sub.category_image as category_image,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image,
           (SELECT json_agg(image_url) FROM product_images WHERE product_id = p.id) as images,
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
             -- Get sale details for badge
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
            (
               SELECT s.name
               FROM product_sales ps
               JOIN sales s ON ps.sale_id = s.id
               WHERE ps.product_id = p.id
                 AND s.is_active = true
                 AND s.start_date <= NOW()
                 AND s.end_date >= NOW()
               ORDER BY s.priority ASC
               LIMIT 1
            ) as sale_name,
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
        JOIN categories sub ON p.category_id = sub.id
        JOIN categories c ON sub.parent_id = c.id
        WHERE sub.id = $1
        ORDER BY p.created_at DESC;
      `, [categoryId]);
    }

    console.log("This api")

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      category: {
        id: category.id,
        name: category.name,
        type: category.parent_id === null ? 'main' : 'sub'
      }
    });
  } catch (error) {
    console.error('Error fetching products by subcategory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Single product full detail
export const getProductFullDetail = async (req, res) => {
  const { id } = req.params;

  // NOTE: Caching is handled by the route middleware cacheMiddleware
  // We removed internal caching here to avoid cache inconsistency issues

  try {
    const now = new Date().toISOString();

    // Main product query with all related data and active sale info
    const result = await pool.query(`
      SELECT
          p.*,
          COALESCE(p.brand_by, 'shagungallery') as brand_by,
          c.name as category_name,
          c.slug as category_slug,
          c.parent_id as category_parent_id,
          (SELECT name FROM categories WHERE id = c.parent_id) as parent_category_name,
          (SELECT slug FROM categories WHERE id = c.parent_id) as parent_category_slug,
          
          -- Active Sale Details
          ROUND(p.price - (p.price * COALESCE(active_sale.discount_percentage, 0) / 100), 2) as sale_price,
          active_sale.discount_percentage as sale_discount,
          active_sale.badge_text as sale_badge_text,
          active_sale.name as sale_name,
          active_sale.end_date as sale_end_date,
          (active_sale.id IS NOT NULL) as on_sale,
          
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', pv.id,
              'size', pv.size,
              'color', pv.color,
              'color_code', pv.color_code,
              'price', pv.price,
              'stock', pv.stock
            ) ORDER BY pv.id ASC)
            FROM product_variants pv
            WHERE pv.product_id = p.id),
            '[]'
          ) as variants,

          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'is_primary', pi.is_primary,
              'position', pi.position,
              'color', pi.color,
              'color_code', pi.color_code
            ) ORDER BY pi.is_primary DESC, pi.position ASC)
            FROM product_images pi
            WHERE pi.product_id = p.id),
            '[]'
          ) as images,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', r.id,
              'rating', r.rating,
              'comment', r.comment,
              'user_name', u.username,
              'created_at', r.created_at
            ) ORDER BY r.created_at DESC)
            FROM product_reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = p.id AND r.is_approved = true),
            '[]'
          ) as reviews,
          (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_approved = true) as review_count,
          (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = p.id AND is_approved = true) as avg_rating

      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      
      -- Join with Best Active Sale
      LEFT JOIN LATERAL (
        SELECT s.*
        FROM product_sales ps
        JOIN sales s ON ps.sale_id = s.id
        WHERE ps.product_id = p.id
          AND s.is_active = true
          AND s.start_date <= NOW()
          AND s.end_date >= NOW()
        ORDER BY s.priority ASC
        LIMIT 1
      ) active_sale ON true

      WHERE p.id = $1 AND p.is_published = true
      GROUP BY p.id, c.id, active_sale.id, active_sale.discount_percentage, active_sale.badge_text, active_sale.name, active_sale.end_date
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = result.rows[0];

    // DEBUG LOG
    console.log(`[ProductDetail] ID: ${id}, on_sale: ${product.on_sale}, sale_price: ${product.sale_price}`);

    // Parse review stats
    const averageRating = parseFloat(product.avg_rating || 0);
    const reviewCount = parseInt(product.review_count || 0);

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const reviewsList = typeof product.reviews === 'string' ? JSON.parse(product.reviews) : (product.reviews || []);

    if (Array.isArray(reviewsList)) {
      reviewsList.forEach(r => {
        const rating = Math.round(r.rating);
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
        }
      });
    }

    const variants = product.variants || [];
    const totalVariantStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    const totalStock = product.stock || totalVariantStock;

    // Get unique sizes and colors
    const availableSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
    const availableColors = [...new Set(variants.map(v => v.color).filter(Boolean))];

    // Stock status
    let stockStatus = 'out_of_stock';
    if (totalStock > 10) stockStatus = 'in_stock';
    else if (totalStock > 0) stockStatus = 'low_stock';

    // =========================================================================
    // ENHANCED DATA SECTIONS
    // =========================================================================

    // Breadcrumbs for navigation
    const breadcrumbs = [
      { label: "Home", path: "/" },
      ...(product.parent_category_name ? [{
        label: product.parent_category_name,
        path: `/category/${product.parent_category_slug}`
      }] : []),
      ...(product.category_name ? [{
        label: product.category_name,
        path: `/category/${product.category_slug}`
      }] : []),
      { label: product.name, path: null }
    ];

    // Size guide (standard for fashion)
    const sizeGuide = {
      XS: { chest: "32-34", waist: "24-26", hip: "34-36", length: "38" },
      S: { chest: "34-36", waist: "26-28", hip: "36-38", length: "39" },
      M: { chest: "36-38", waist: "28-30", hip: "38-40", length: "40" },
      L: { chest: "38-40", waist: "30-32", hip: "40-42", length: "41" },
      XL: { chest: "40-42", waist: "32-34", hip: "42-44", length: "42" },
      "2XL": { chest: "42-44", waist: "34-36", hip: "44-46", length: "43" },
      "3XL": { chest: "44-46", waist: "36-38", hip: "46-48", length: "44" }
    };

    // Product highlights (derived from data or defaults)
    const highlights = [];
    if (product.fabric?.type) highlights.push(`${product.fabric.type} Fabric`);
    if (product.fabric?.composition) highlights.push(product.fabric.composition);
    if (product.shipping?.free) highlights.push("Free Shipping");
    if (product.detail_description?.origin) highlights.push(`Made in ${product.detail_description.origin}`);
    if (product.detail_description?.material) highlights.push(`${product.detail_description.material}`);

    // Default highlights if none
    if (highlights.length === 0) {
      highlights.push("Premium Quality", "Handcrafted", "Easy Returns");
    }

    // Trust badges
    const trustBadges = [
      { icon: "shield", text: "Secure Checkout", description: "SSL encrypted payment" },
      { icon: "truck", text: product.shipping?.free ? "Free Shipping" : "Fast Delivery", description: `Delivers in ${product.shipping?.estimated_days || 5} days` },
      { icon: "refresh", text: "Easy Returns", description: "7-day return policy" },
      { icon: "star", text: "Quality Assured", description: "100% genuine product" }
    ];

    // =========================================================================
    // DESCRIPTION SECTION - Formatted for tabs
    // =========================================================================
    const descriptionSection = {
      short: product.description || "",
      full: product.detail_description?.full || product.description || "",
      features: product.detail_description?.features || [
        "Premium quality fabric",
        "Comfortable fit",
        "Traditional design with modern appeal",
        "Ideal for formal and festive occasions"
      ],
      specifications: {
        material: product.detail_description?.material || product.fabric?.composition || "Not specified",
        origin: product.detail_description?.origin || "India",
        care: product.detail_description?.care || "Dry clean recommended",
        weight: product.detail_description?.weight || "Light weight",
        occasion: product.detail_description?.occasion || "Casual, Festive, Party"
      }
    };

    // =========================================================================
    // FABRIC & CARE SECTION
    // =========================================================================
    const fabricCareSection = {
      fabric: {
        type: product.fabric?.type || "Premium Fabric",
        composition: product.fabric?.composition || "100% Premium Material",
        weave: product.fabric?.weave || "Traditional",
        feel: product.fabric?.feel || "Soft and comfortable"
      },
      care_instructions: [
        {
          icon: "hand",
          title: "Washing",
          instruction: product.detail_description?.washing || "Dry clean only for best results"
        },
        {
          icon: "iron",
          title: "Ironing",
          instruction: product.detail_description?.ironing || "Iron on low heat. Do not use steam"
        },
        {
          icon: "sun",
          title: "Drying",
          instruction: product.detail_description?.drying || "Dry in shade. Avoid direct sunlight"
        },
        {
          icon: "hanger",
          title: "Storage",
          instruction: product.detail_description?.storage || "Store in a cool, dry place. Use muslin cloth cover"
        }
      ],
      special_care: product.detail_description?.special_care || [
        "Avoid contact with perfumes and deodorants",
        "Do not wring or twist",
        "Store folded to maintain shape"
      ]
    };

    // =========================================================================
    // SHIPPING & RETURNS SECTION
    // =========================================================================
    const shippingReturnsSection = {
      shipping: {
        is_free: product.shipping?.free || false,
        estimated_days: product.shipping?.estimated_days || 5,
        message: product.shipping?.free
          ? `FREE delivery in ${product.shipping?.estimated_days || 5} days`
          : `Delivery in ${product.shipping?.estimated_days || 5} days`,
        delivery_date: new Date(Date.now() + ((product.shipping?.estimated_days || 5) * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        options: [
          {
            name: "Standard Delivery",
            price: product.shipping?.free ? "FREE" : "₹99",
            days: `${product.shipping?.estimated_days || 5}-${(product.shipping?.estimated_days || 5) + 2} business days`
          },
          {
            name: "Express Delivery",
            price: "₹199",
            days: "2-3 business days"
          },
          {
            name: "Same Day Delivery",
            price: "₹399",
            days: "Available in select cities",
            note: "Order before 12 PM"
          }
        ],
        pincode_check: true,
        cash_on_delivery: true
      },
      returns: {
        policy: product.return_policy || "Money-back guarantee within 7 days of purchase. Item must be unworn and in original condition.",
        days: 7,
        conditions: [
          "Item must be unworn with all original tags attached",
          "Item should be in original packaging",
          "No alterations or customizations made",
          "Return request within 7 days of delivery"
        ],
        process: [
          { step: 1, title: "Initiate Return", description: "Go to Orders and select 'Return Item'" },
          { step: 2, title: "Pack the Item", description: "Pack the product in original packaging" },
          { step: 3, title: "Schedule Pickup", description: "Our delivery partner will pick up the item" },
          { step: 4, title: "Get Refund", description: "Refund initiated within 3-5 business days" }
        ],
        exchange_available: true,
        refund_method: "Original payment method"
      }
    };

    // =========================================================================
    // FAQ SECTION - Enhanced
    // =========================================================================
    const defaultFaqs = [
      {
        question: "Is COD available?",
        answer: "No, Cash on Delivery is not available for this product."
      },
      {
        question: "What is the fabric quality?",
        answer: `This product is made from ${product.fabric?.composition || 'premium quality material'} ensuring comfort and durability.`
      },
      {
        question: "How do I care for this product?",
        answer: product.detail_description?.care || "We recommend dry cleaning for best results. Store in a cool, dry place."
      },
      {
        question: "What is the return policy?",
        answer: product.return_policy || "We offer a 7-day return policy. The item must be unworn with original tags attached."
      },
      {
        question: "How long will delivery take?",
        answer: `Standard delivery takes ${product.shipping?.estimated_days || 5}-${(product.shipping?.estimated_days || 5) + 2} business days. Express options are also available.`
      }
    ];

    const faqSection = Array.isArray(product.faq) && product.faq.length > 0
      ? [
        ...product.faq,
        // Add default FAQs that aren't already covered by custom FAQs
        ...defaultFaqs.filter(defaultFaq =>
          !product.faq.some(customFaq =>
            customFaq.question?.toLowerCase().includes(defaultFaq.question.toLowerCase().split(' ')[0]) ||
            defaultFaq.question.toLowerCase().includes(customFaq.question?.toLowerCase().split(' ')[0] || '')
          )
        )
      ]
      : defaultFaqs;

    // =========================================================================
    // PRODUCT SPECIFICATIONS TABLE
    // =========================================================================
    const specifications = [
      { label: "Material", value: product.detail_description?.material || product.fabric?.composition || "Premium Material" },
      { label: "Fabric Type", value: product.fabric?.type || "Premium Fabric" },
      { label: "Pattern", value: product.detail_description?.pattern || "Traditional" },
      { label: "Occasion", value: product.detail_description?.occasion || "Festive, Party, Wedding" },
      { label: "Color", value: availableColors.length > 0 ? availableColors.join(", ") : "As shown" },
      { label: "Length", value: product.detail_description?.length || "Standard" },
      { label: "Work Type", value: product.detail_description?.work || "Handcrafted" },
      { label: "Country of Origin", value: product.detail_description?.origin || "India" },
      { label: "Care", value: product.detail_description?.care || "Dry clean only" },
      { label: "Package Contents", value: product.detail_description?.contents || "1 piece" }
    ];

    // =========================================================================
    // ENHANCED RESPONSE
    // =========================================================================
    const enhancedProduct = {
      ...product,
      // Breadcrumbs
      breadcrumbs,
      // Review statistics
      review_stats: {
        average_rating: Math.round(averageRating * 10) / 10,
        total_reviews: reviewCount,
        rating_distribution: ratingDistribution
      },
      // Stock information
      stock_info: {
        total_stock: totalStock,
        status: stockStatus,
        status_label: stockStatus === 'in_stock' ? 'In Stock' :
          stockStatus === 'low_stock' ? 'Only a few left' : 'Out of Stock'
      },
      // Available options
      available_sizes: availableSizes,
      available_colors: availableColors,
      // Size guide
      size_guide: sizeGuide,
      // Highlights
      highlights,
      // Trust badges
      trust_badges: trustBadges,
      // Detailed sections
      description_section: descriptionSection,
      fabric_care_section: fabricCareSection,
      shipping_returns_section: shippingReturnsSection,
      // FAQ
      faq_section: faqSection,
      // Specifications
      specifications,
      // Formatted shipping (legacy support)
      shipping_info: shippingReturnsSection.shipping,
      // Care instructions (legacy support)
      care_instructions: fabricCareSection.care_instructions.map(c => c.instruction)
    };

    // Cache the result
    try {
      const cacheKey = CacheKeys.productDetail(id);
      await cacheSet(cacheKey, enhancedProduct, CacheTTL.MEDIUM);
    } catch (err) {
      console.warn(`Cache write failed for product ${id}:`, err);
    }

    res.json({ ...enhancedProduct, cache: false });
  } catch (error) {
    console.error("Get Product Full Detail Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// =============================================================================
// GET ALL PRODUCTS (with pagination & filtering)
// =============================================================================
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'desc',
      category,
      minPrice,
      maxPrice,
      inStock,
      isNew,
      isFeatured,
    } = req.query;

    // Cache key generation based on all filter parameters
    const cacheKey = CacheKeys.allProducts(
      page,
      limit,
      `${sort}_${order}`,
      JSON.stringify({ category, minPrice, maxPrice, inStock, isNew, isFeatured })
    );

    // Try to get from cache
    try {
      const cachedData = await cacheGet(cacheKey);
      if (cachedData) {
        // Add cache: true flag to indicate data came from cache
        return res.json({ ...cachedData, cache: true });
      }
    } catch (err) {
      console.warn('Cache read failed for products list:', err);
    }

    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        c.category_image as category_image,
        c.image_url as category_thumbnail,
        COALESCE(
          (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY id ASC LIMIT 1)
        ) as thumbnail_image,
        COALESCE(
          (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY id ASC LIMIT 1)
        ) as image,
        (SELECT json_agg(image_url ORDER BY is_primary DESC, id ASC) FROM product_images WHERE product_id = p.id) as images,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count,
        (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = p.id) as avg_rating,
        COUNT(*) OVER() as total_count,
        
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
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = true
    `;

    if (category) {
      // Check if category is a number (ID) or string (slug/name)
      const isNumeric = /^\d+$/.test(category);
      if (isNumeric) {
        // Search by category ID or parent category ID
        query += ` AND (c.id = $${paramIndex}::int OR c.parent_id = $${paramIndex}::int)`;
        params.push(parseInt(category));
      } else {
        // Search by slug or name (case insensitive) - includes subcategories
        query += ` AND (
          LOWER(c.slug) = LOWER($${paramIndex}) 
          OR LOWER(c.name) = LOWER($${paramIndex})
          OR c.parent_id IN (SELECT id FROM categories WHERE LOWER(slug) = LOWER($${paramIndex}) OR LOWER(name) = LOWER($${paramIndex}))
        )`;
        params.push(category);
      }
      paramIndex++;
    }

    if (minPrice) {
      query += ` AND p.price >= $${paramIndex}`;
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice) {
      query += ` AND p.price <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }

    if (inStock === 'true') {
      query += ` AND p.stock > 0`;
    }

    if (isNew === 'true') {
      query += ` AND p.is_new = true`;
    }

    if (isFeatured === 'true') {
      query += ` AND p.is_featured = true`;
    }

    // Validate sort column
    const validSortColumns = ['created_at', 'price', 'name', 'updated_at'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    query += ` ORDER BY p.${sortColumn} ${sortOrder}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const totalCount = result.rows[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const responseData = {
      success: true,
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount: parseInt(totalCount),
        totalPages,
      },
    };

    // Cache the result
    try {
      await cacheSet(cacheKey, responseData, CacheTTL.SHORT);
    } catch (err) {
      console.warn('Cache write failed for products list:', err);
    }

    res.json({ ...responseData, cache: false });
  } catch (error) {
    console.error('Get All Products Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================================================
// GET ALL PRODUCTS FOR ADMIN (includes unpublished)
// =============================================================================
export const getAllProductsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'desc',
      category,
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    let query = `
      SELECT
    p.*,
      c.name as category_name,
      c.slug as category_slug,
      c.category_image as category_image,
      c.image_url as category_thumbnail,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count,
          COUNT(*) OVER() as total_count,

            --Active Sale Details(Same as user API for consistency)
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
  --Check if on sale
EXISTS(
  SELECT 1
           FROM product_sales ps
           JOIN sales s ON ps.sale_id = s.id
           WHERE ps.product_id = p.id
             AND s.is_active = true
             AND s.start_date <= NOW()
             AND s.end_date >= NOW()
) as on_sale,
  --Sale Discount
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
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1 = 1
  `;

    // Search filter
    if (search && search.trim()) {
      query += ` AND(p.name ILIKE $${paramIndex} OR p.slug ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Category filter
    if (category) {
      const isNumeric = /^\d+$/.test(category);
      if (isNumeric) {
        query += ` AND(c.id = $${paramIndex}:: int OR c.parent_id = $${paramIndex}:: int)`;
        params.push(parseInt(category));
      } else {
        query += ` AND(LOWER(c.slug) = LOWER($${paramIndex}) OR LOWER(c.name) = LOWER($${paramIndex}))`;
        params.push(category);
      }
      paramIndex++;
    }

    // Validate sort column
    const validSortColumns = ['created_at', 'price', 'name', 'updated_at', 'stock'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    query += ` ORDER BY p.${sortColumn} ${sortOrder} `;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1} `;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const totalCount = result.rows[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount: parseInt(totalCount),
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get All Products Admin Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================================================
// SEARCH PRODUCTS
// =============================================================================
export const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const offset = (page - 1) * limit;
    const searchTerm = `% ${q.trim()}% `;

    const result = await pool.query(`
SELECT
p.*,
  c.name as category_name,
  c.category_image as category_image,
  COALESCE(
    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
  (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY id ASC LIMIT 1)
        ) as thumbnail_image,
  COALESCE(
    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
  (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY id ASC LIMIT 1)
        ) as image,
  (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = p.id) as avg_rating,
    COUNT(*) OVER() as total_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = true
AND(
  p.name ILIKE $1 
          OR p.description ILIKE $1 
          OR c.name ILIKE $1
          OR $2 = ANY(p.tags)
)
      ORDER BY 
        CASE WHEN p.name ILIKE $1 THEN 1 ELSE 2 END,
  p.created_at DESC
      LIMIT $3 OFFSET $4
  `, [searchTerm, q.trim().toLowerCase(), limit, offset]);

    const totalCount = result.rows[0]?.total_count || 0;

    res.json({
      success: true,
      query: q,
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount: parseInt(totalCount),
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Search Products Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================================================
// GET FEATURED PRODUCTS (for homepage)
// =============================================================================
export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const result = await pool.query(`
SELECT
p.*,
  c.name as category_name,
  c.category_image as category_image,
  COALESCE(
    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
  (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY id ASC LIMIT 1)
        ) as thumbnail_image,
  COALESCE(
    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
  (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY id ASC LIMIT 1)
        ) as image,
  (SELECT json_agg(image_url ORDER BY is_primary DESC, id ASC) FROM product_images WHERE product_id = p.id LIMIT 4) as images,
    (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count,
      (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = p.id) as avg_rating,

        --Calculate sale_price if active sale exists
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
  NULL
        ) as sale_price,
  --Check if on sale
EXISTS(
  SELECT 1
           FROM product_sales ps
           JOIN sales s ON ps.sale_id = s.id
           WHERE ps.product_id = p.id
             AND s.is_active = true
             AND s.start_date <= NOW()
             AND s.end_date >= NOW()
) as on_sale,
  --Get sale badge text
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
    --Get sale name
      (
        SELECT s.name
           FROM product_sales ps
           JOIN sales s ON ps.sale_id = s.id
           WHERE ps.product_id = p.id
             AND s.is_active = true
             AND s.start_date <= NOW()
             AND s.end_date >= NOW()
           ORDER BY s.priority ASC
           LIMIT 1
      ) as sale_name,
      --Get sale discount percentage
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
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = true AND p.is_featured = true
      ORDER BY p.updated_at DESC
      LIMIT $1
  `, [limit]);

    res.json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error('Get Featured Products Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================================================
// GET RELATED PRODUCTS (prioritizes manual selections, falls back to same category)
// =============================================================================
export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    // Cache key for related products
    const cacheKey = CacheKeys.relatedProducts(id);

    try {
      const cachedData = await cacheGet(cacheKey);
      if (cachedData) {
        // Add cache: true flag to indicate data came from cache
        return res.json({ ...cachedData, cache: true });
      }
    } catch (err) {
      console.warn(`Cache read failed for related products ${id}:`, err);
    }

    // 1. First check for manually set related products
    const manualRelated = await pool.query(`
SELECT
p.id,
  p.name,
  p.price,
  p.slug,
  p.created_at,
  c.name as category_name,
  c.category_image as category_image,
  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
      FROM related_products rp
      JOIN products p ON rp.related_product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE rp.product_id = $1
        AND p.is_published = true
      ORDER BY rp.sort_order ASC, rp.created_at ASC
      LIMIT $2
  `, [id, limit]);

    // If we have manual related products, return them
    if (manualRelated.rows.length > 0) {
      const response = {
        success: true,
        products: manualRelated.rows,
        source: 'manual'
      };

      try {
        await cacheSet(cacheKey, response, CacheTTL.MEDIUM);
      } catch (err) {
        console.warn(`Cache write failed for related products ${id}:`, err);
      }

      return res.json({ ...response, cache: false });
    }

    // 2. Fallback to same category products
    const productRes = await pool.query('SELECT category_id FROM products WHERE id = $1', [id]);

    if (productRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const categoryId = productRes.rows[0].category_id;

    const result = await pool.query(`
SELECT
p.id,
  p.name,
  p.price,
  p.slug,
  p.created_at,
  c.name as category_name,
  c.category_image as category_image,
  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = $1 
        AND p.id != $2
        AND p.is_published = true
      ORDER BY p.created_at DESC
      LIMIT $3
  `, [categoryId, id, limit]);

    const responseData = {
      success: true,
      products: result.rows,
      source: 'auto'
    };

    try {
      await cacheSet(cacheKey, responseData, CacheTTL.MEDIUM);
    } catch (err) {
      console.warn(`Cache write failed for related products ${id}:`, err);
    }

    res.json({ ...responseData, cache: false });
  } catch (error) {
    console.error('Get Related Products Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================================================
// GET RELATED PRODUCTS FOR ADMIN (shows manual selections)
// =============================================================================
export const getRelatedProductsAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
SELECT
rp.id as relation_id,
  rp.sort_order,
  rp.created_at as added_at,
  p.id,
  p.name,
  p.price,
  p.slug,
  p.is_published,
  c.name as category_name,
  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
      FROM related_products rp
      JOIN products p ON rp.related_product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE rp.product_id = $1
      ORDER BY rp.sort_order ASC, rp.created_at ASC
  `, [id]);

    res.json({
      success: true,
      related_products: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get Related Products Admin Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================================================
// ADD RELATED PRODUCT (Admin)
// =============================================================================
export const addRelatedProduct = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const { related_product_id, sort_order = 0 } = req.body;

    if (!related_product_id) {
      return res.status(400).json({
        success: false,
        message: 'related_product_id is required'
      });
    }

    if (parseInt(id) === parseInt(related_product_id)) {
      return res.status(400).json({
        success: false,
        message: 'A product cannot be related to itself'
      });
    }

    // Check if both products exist
    const productCheck = await pool.query(
      'SELECT id FROM products WHERE id IN ($1, $2)',
      [id, related_product_id]
    );

    if (productCheck.rows.length < 2) {
      return res.status(404).json({
        success: false,
        message: 'One or both products not found'
      });
    }

    // Insert the relation
    const result = await pool.query(`
      INSERT INTO related_products(product_id, related_product_id, sort_order)
VALUES($1, $2, $3)
      ON CONFLICT(product_id, related_product_id) DO UPDATE SET sort_order = $3
RETURNING *
  `, [id, related_product_id, sort_order]);

    // Invalidate cache
    await publishCacheInvalidation(`cache:products:related:${id}`);

    res.json({
      success: true,
      message: 'Related product added successfully',
      relation: result.rows[0]
    });
  } catch (error) {
    console.error('Add Related Product Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================================================
// ADD MULTIPLE RELATED PRODUCTS (Admin)
// =============================================================================
export const addMultipleRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const { related_product_ids } = req.body;

    if (!Array.isArray(related_product_ids) || related_product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'related_product_ids array is required'
      });
    }

    // Filter out the product itself
    const validIds = related_product_ids.filter(rid => parseInt(rid) !== parseInt(id));

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid related product IDs provided'
      });
    }

    // Insert all relations
    const values = validIds.map((rid, index) => `($1, $2, $3)`);
    let insertedCount = 0;

    for (let i = 0; i < validIds.length; i++) {
      try {
        await pool.query(`
          INSERT INTO related_products(product_id, related_product_id, sort_order)
VALUES($1, $2, $3)
          ON CONFLICT(product_id, related_product_id) DO NOTHING
        `, [id, validIds[i], i]);
        insertedCount++;
      } catch (err) {
        console.error(`Failed to add relation for product ${validIds[i]}: `, err.message);
      }
    }

    // Invalidate cache
    await publishCacheInvalidation(`cache:products:related:${id}`);

    res.json({
      success: true,
      message: `Added ${insertedCount} related products`,
      added_count: insertedCount
    });
  } catch (error) {
    console.error('Add Multiple Related Products Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================================================
// UPDATE RELATED PRODUCT ORDER (Admin)
// =============================================================================
export const updateRelatedProductOrder = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const { related_products } = req.body; // Array of { related_product_id, sort_order }

    if (!Array.isArray(related_products)) {
      return res.status(400).json({
        success: false,
        message: 'related_products array is required'
      });
    }

    // Update each relation's sort order
    for (const item of related_products) {
      await pool.query(`
        UPDATE related_products 
        SET sort_order = $1
        WHERE product_id = $2 AND related_product_id = $3
  `, [item.sort_order, id, item.related_product_id]);
    }

    // Invalidate cache
    await publishCacheInvalidation(`cache:products:related:${id}`);

    res.json({
      success: true,
      message: 'Related products order updated'
    });
  } catch (error) {
    console.error('Update Related Product Order Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================================================
// REMOVE RELATED PRODUCT (Admin)
// =============================================================================
export const removeRelatedProduct = async (req, res) => {
  try {
    const { id, relatedId } = req.params;

    const result = await pool.query(`
      DELETE FROM related_products 
      WHERE product_id = $1 AND related_product_id = $2
RETURNING *
  `, [id, relatedId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Relation not found'
      });
    }

    // Invalidate cache
    await publishCacheInvalidation(`cache:products:related:${id}`);

    res.json({
      success: true,
      message: 'Related product removed successfully'
    });
  } catch (error) {
    console.error('Remove Related Product Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================================================
// CLEAR ALL RELATED PRODUCTS (Admin)
// =============================================================================
export const clearRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM related_products WHERE product_id = $1
RETURNING *
  `, [id]);

    // Invalidate cache
    await publishCacheInvalidation(`cache:products:related:${id}`);

    res.json({
      success: true,
      message: `Removed ${result.rowCount} related products`,
      removed_count: result.rowCount
    });
  } catch (error) {
    console.error('Clear Related Products Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete product (admin) - Also deletes all images and folder from Cloudinary
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`🗑️ Deleting product: ${id}`);

    // Step 1: Fetch product details (for folder name) and all images
    const productResult = await pool.query(
      "SELECT slug, name FROM products WHERE id = $1",
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = productResult.rows[0];
    const sanitizedSlug = (product.slug || product.name || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    const cloudinaryFolder = `products/${sanitizedSlug}`;
    console.log(`📁 Product folder: ${cloudinaryFolder}`);

    const imagesResult = await pool.query(
      "SELECT id, image_url FROM product_images WHERE product_id = $1",
      [id]
    );
    const images = imagesResult.rows;
    console.log(`📷 Found ${images.length} images to delete from Cloudinary`);

    // Step 2: Delete each image from Cloudinary
    const cloudinaryDeletePromises = images.map(async (image) => {
      if (image.image_url) {
        const publicId = extractCloudinaryPublicId(image.image_url);
        if (publicId) {
          try {
            console.log(`  🗑️ Deleting from Cloudinary: ${publicId}`);
            const result = await cloudinary.uploader.destroy(publicId);
            console.log(`  ✅ Cloudinary result: ${result.result}`);
            return { success: true, publicId };
          } catch (err) {
            console.error(`  ⚠️ Failed to delete ${publicId}:`, err.message);
            return { success: false, publicId, error: err.message };
          }
        }
      }
      return null;
    });

    // Wait for all Cloudinary image deletions
    const cloudinaryResults = await Promise.allSettled(cloudinaryDeletePromises);
    const successCount = cloudinaryResults.filter(
      r => r.status === 'fulfilled' && r.value?.success
    ).length;
    console.log(`✅ Cloudinary cleanup: ${successCount}/${images.length} images deleted`);

    // Step 3: Delete the folder from Cloudinary (only if images were in folder)
    let folderDeleted = false;
    if (images.length > 0) {
      try {
        console.log(`📁 Deleting Cloudinary folder: ${cloudinaryFolder}`);
        await cloudinary.api.delete_folder(cloudinaryFolder);
        console.log(`✅ Folder deleted: ${cloudinaryFolder}`);
        folderDeleted = true;
      } catch (folderErr) {
        // Folder might not exist or might have other files - that's okay
        console.log(`⚠️ Could not delete folder (may not exist or not empty): ${folderErr.message}`);
      }
    }

    // Step 4: Delete product from database (cascade will delete images, variants, reviews)
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    console.log(`✅ Product ${id} deleted from database`);

    // Step 5: Invalidate all caches
    await publishCacheInvalidation('cache:*');

    res.json({
      message: "Product deleted successfully",
      cloudinary_cleanup: {
        total_images: images.length,
        images_deleted: successCount,
        folder: cloudinaryFolder,
        folder_deleted: folderDeleted
      }
    });
  } catch (error) {
    console.error('❌ deleteProduct error:', error);
    res.status(500).json({ error: error.message });
  }
};


