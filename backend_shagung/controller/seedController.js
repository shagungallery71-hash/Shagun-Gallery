/**
 * Seed Controller - Seeds the database with sample data
 */
import pool from '../config/dbconfig.js';

export const seedDatabase = async (req, res) => {
    const client = await pool.connect();

    try {
        console.log('🗑️ Clearing existing product data...');

        await client.query('BEGIN');

        // Delete in order of dependencies (keep users and orders)
        await client.query('DELETE FROM product_reviews');
        await client.query('DELETE FROM cart_items');
        await client.query('DELETE FROM wishlist');
        await client.query('DELETE FROM product_images');
        await client.query('DELETE FROM product_variants');
        await client.query('DELETE FROM products');
        await client.query('DELETE FROM categories');

        console.log('✅ Old data cleared');

        // =========================================================================
        // CATEGORIES
        // =========================================================================
        const categoriesData = [
            { name: 'Ethnic Wear', slug: 'ethnic-wear' },
            { name: 'Western Wear', slug: 'western-wear' },
            { name: 'Fusion Wear', slug: 'fusion-wear' },
            { name: 'Bridal', slug: 'bridal' },
            { name: 'Accessories', slug: 'accessories' },
        ];

        const categoryIds = {};
        for (const cat of categoriesData) {
            const result = await client.query(
                `INSERT INTO categories (name, slug, is_active) 
         VALUES ($1, $2, TRUE) RETURNING id`,
                [cat.name, cat.slug]
            );
            categoryIds[cat.slug] = result.rows[0].id;
        }

        // Sub-categories
        const subCategories = [
            { name: 'Sarees', slug: 'sarees', parent_id: categoryIds['ethnic-wear'] },
            { name: 'Kurtis', slug: 'kurtis', parent_id: categoryIds['ethnic-wear'] },
            { name: 'Lehengas', slug: 'lehengas', parent_id: categoryIds['ethnic-wear'] },
            { name: 'Dresses', slug: 'dresses', parent_id: categoryIds['western-wear'] },
            { name: 'Tops', slug: 'tops', parent_id: categoryIds['western-wear'] },
        ];

        for (const sub of subCategories) {
            const result = await client.query(
                `INSERT INTO categories (name, slug, parent_id, is_active) 
         VALUES ($1, $2, $3, TRUE) RETURNING id`,
                [sub.name, sub.slug, sub.parent_id]
            );
            categoryIds[sub.slug] = result.rows[0].id;
        }

        // =========================================================================
        // PRODUCTS
        // =========================================================================
        const products = [
            {
                name: 'Red Banarasi Silk Saree',
                slug: 'red-banarasi-silk-saree',
                description: 'Luxurious red Banarasi silk saree with intricate gold zari work. Perfect for weddings and festive occasions.',
                category_id: categoryIds['sarees'],
                price: 12999,
                compare_at_price: 18999,
                is_featured: true,
                is_new: true,
                fabric: { type: 'Silk', composition: '100% Pure Silk', weave: 'Banarasi' },
                shipping: { free: true, estimated_days: 5 },
                detail_description: { material: 'Pure Silk', origin: 'Varanasi, India', care: 'Dry clean only' },
                images: [
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
                    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200',
                ],
                variants: [
                    { size: 'Free Size', color: 'Red', price: 12999, stock: 15 },
                    { size: 'Free Size', color: 'Maroon', price: 12999, stock: 10 },
                ]
            },
            {
                name: 'Navy Blue Chanderi Saree',
                slug: 'navy-blue-chanderi-saree',
                description: 'Elegant navy blue Chanderi saree with silver border.',
                category_id: categoryIds['sarees'],
                price: 4599,
                compare_at_price: 6999,
                is_featured: false,
                is_new: true,
                fabric: { type: 'Chanderi', composition: 'Cotton Silk blend' },
                shipping: { free: true, estimated_days: 4 },
                images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200'],
                variants: [
                    { size: 'Free Size', color: 'Navy Blue', price: 4599, stock: 20 },
                ]
            },
            {
                name: 'Floral Printed Cotton Kurti',
                slug: 'floral-printed-cotton-kurti',
                description: 'Breathable cotton kurti with beautiful floral prints.',
                category_id: categoryIds['kurtis'],
                price: 1299,
                compare_at_price: 1999,
                is_featured: true,
                is_new: false,
                fabric: { type: 'Cotton', composition: '100% Cotton' },
                shipping: { free: false, estimated_days: 3 },
                images: [
                    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
                    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200',
                ],
                variants: [
                    { size: 'S', color: 'Pink', price: 1299, stock: 25 },
                    { size: 'M', color: 'Pink', price: 1299, stock: 30 },
                    { size: 'L', color: 'Pink', price: 1299, stock: 20 },
                    { size: 'XL', color: 'Pink', price: 1399, stock: 15 },
                ]
            },
            {
                name: 'Embroidered Anarkali Kurti',
                slug: 'embroidered-anarkali-kurti',
                description: 'Stunning anarkali kurti with intricate embroidery work.',
                category_id: categoryIds['kurtis'],
                price: 2499,
                compare_at_price: 3999,
                is_featured: true,
                is_new: true,
                fabric: { type: 'Rayon', composition: '100% Rayon' },
                shipping: { free: true, estimated_days: 4 },
                images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200'],
                variants: [
                    { size: 'S', color: 'Maroon', price: 2499, stock: 18 },
                    { size: 'M', color: 'Maroon', price: 2499, stock: 22 },
                    { size: 'L', color: 'Maroon', price: 2499, stock: 16 },
                ]
            },
            {
                name: 'Royal Blue Bridal Lehenga',
                slug: 'royal-blue-bridal-lehenga',
                description: 'Exquisite bridal lehenga in royal blue with heavy embroidery.',
                category_id: categoryIds['lehengas'],
                price: 45999,
                compare_at_price: 65000,
                is_featured: true,
                is_new: true,
                fabric: { type: 'Velvet', composition: 'Velvet with Net dupatta' },
                shipping: { free: true, estimated_days: 7 },
                images: [
                    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
                ],
                variants: [
                    { size: 'S', color: 'Royal Blue', price: 45999, stock: 5 },
                    { size: 'M', color: 'Royal Blue', price: 45999, stock: 8 },
                    { size: 'L', color: 'Royal Blue', price: 45999, stock: 6 },
                ]
            },
            {
                name: 'Elegant Black Midi Dress',
                slug: 'elegant-black-midi-dress',
                description: 'Classic black midi dress perfect for parties.',
                category_id: categoryIds['dresses'],
                price: 2999,
                compare_at_price: 4499,
                is_featured: true,
                is_new: false,
                fabric: { type: 'Polyester', composition: 'Polyester blend' },
                shipping: { free: true, estimated_days: 3 },
                images: [
                    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200',
                    'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200',
                ],
                variants: [
                    { size: 'S', color: 'Black', price: 2999, stock: 20 },
                    { size: 'M', color: 'Black', price: 2999, stock: 25 },
                    { size: 'L', color: 'Black', price: 2999, stock: 18 },
                ]
            },
            {
                name: 'Floral Summer Maxi Dress',
                slug: 'floral-summer-maxi-dress',
                description: 'Light and breezy floral maxi dress for summer days.',
                category_id: categoryIds['dresses'],
                price: 1899,
                compare_at_price: 2999,
                is_featured: false,
                is_new: true,
                fabric: { type: 'Cotton', composition: '100% Cotton' },
                shipping: { free: false, estimated_days: 3 },
                images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200'],
                variants: [
                    { size: 'S', color: 'White Floral', price: 1899, stock: 15 },
                    { size: 'M', color: 'White Floral', price: 1899, stock: 22 },
                    { size: 'L', color: 'White Floral', price: 1899, stock: 18 },
                ]
            },
            {
                name: 'Classic White Blouse',
                slug: 'classic-white-blouse',
                description: 'Elegant white blouse for office and formal occasions.',
                category_id: categoryIds['tops'],
                price: 1299,
                compare_at_price: 1799,
                is_featured: false,
                is_new: false,
                fabric: { type: 'Cotton', composition: '100% Cotton' },
                shipping: { free: false, estimated_days: 2 },
                images: ['https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=1200'],
                variants: [
                    { size: 'S', color: 'White', price: 1299, stock: 30 },
                    { size: 'M', color: 'White', price: 1299, stock: 35 },
                    { size: 'L', color: 'White', price: 1299, stock: 25 },
                ]
            },
            {
                name: 'Indo-Western Palazzo Set',
                slug: 'indo-western-palazzo-set',
                description: 'Stylish indo-western palazzo set with printed kurti.',
                category_id: categoryIds['fusion-wear'],
                price: 2299,
                compare_at_price: 3499,
                is_featured: true,
                is_new: true,
                fabric: { type: 'Rayon', composition: '100% Rayon' },
                shipping: { free: true, estimated_days: 4 },
                images: [
                    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200',
                    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
                ],
                variants: [
                    { size: 'S', color: 'Mustard', price: 2299, stock: 18 },
                    { size: 'M', color: 'Mustard', price: 2299, stock: 24 },
                    { size: 'L', color: 'Mustard', price: 2299, stock: 20 },
                ]
            },
            {
                name: 'Designer Bridal Saree',
                slug: 'designer-bridal-saree',
                description: 'Exquisite designer bridal saree with heavy embroidery.',
                category_id: categoryIds['bridal'],
                price: 35999,
                compare_at_price: 50000,
                is_featured: true,
                is_new: true,
                fabric: { type: 'Georgette', composition: 'Heavy Georgette' },
                shipping: { free: true, estimated_days: 7 },
                images: [
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
                    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
                ],
                variants: [
                    { size: 'Free Size', color: 'Maroon', price: 35999, stock: 8 },
                    { size: 'Free Size', color: 'Red', price: 35999, stock: 6 },
                ]
            },
            {
                name: 'Pearl Necklace Set',
                slug: 'pearl-necklace-set',
                description: 'Elegant pearl necklace set with matching earrings.',
                category_id: categoryIds['accessories'],
                price: 1999,
                compare_at_price: 2999,
                is_featured: false,
                is_new: false,
                fabric: null,
                shipping: { free: false, estimated_days: 2 },
                images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200'],
                variants: [
                    { size: 'One Size', color: 'Pearl White', price: 1999, stock: 50 },
                ]
            },
            {
                name: 'Silk Scarf',
                slug: 'silk-scarf',
                description: 'Luxurious silk scarf with beautiful printed patterns.',
                category_id: categoryIds['accessories'],
                price: 1499,
                compare_at_price: 2199,
                is_featured: false,
                is_new: true,
                fabric: { type: 'Silk', composition: '100% Silk' },
                shipping: { free: false, estimated_days: 2 },
                images: ['https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=1200'],
                variants: [
                    { size: 'One Size', color: 'Multi', price: 1499, stock: 35 },
                ]
            },
        ];

        for (const product of products) {
            const productResult = await client.query(
                `INSERT INTO products (
          category_id, name, slug, description, price, compare_at_price,
          is_published, is_featured, is_new, fabric, shipping, detail_description, return_policy
        ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8, $9, $10, $11, '7-day easy returns')
        RETURNING id`,
                [
                    product.category_id,
                    product.name,
                    product.slug,
                    product.description,
                    product.price,
                    product.compare_at_price,
                    product.is_featured,
                    product.is_new,
                    JSON.stringify(product.fabric || {}),
                    JSON.stringify(product.shipping || {}),
                    JSON.stringify(product.detail_description || {}),
                ]
            );
            const productId = productResult.rows[0].id;

            for (let i = 0; i < product.images.length; i++) {
                await client.query(
                    `INSERT INTO product_images (product_id, image_url, is_primary, position) VALUES ($1, $2, $3, $4)`,
                    [productId, product.images[i], i === 0, i]
                );
            }

            for (const variant of product.variants) {
                await client.query(
                    `INSERT INTO product_variants (product_id, size, color, price, stock) VALUES ($1, $2, $3, $4, $5)`,
                    [productId, variant.size, variant.color, variant.price, variant.stock]
                );
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Database seeded successfully',
            data: {
                categories: Object.keys(categoryIds).length,
                products: products.length
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding database:', error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};
