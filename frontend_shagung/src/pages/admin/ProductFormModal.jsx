// =============================================================================
// PRODUCT FORM MODAL COMPONENT
// Complete product editing with tabs for details, variants, images, and SEO
// =============================================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Package, Image as ImageIcon, Layers, Settings, Tag, FileText, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { adminApi } from './index';
import { Button, Badge } from '../../components/ui';
import VariantManager from './VariantManager';
import ImageManager from './ImageManager';

// Tab Button Component
const TabButton = ({ active, icon: Icon, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${active
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

// Input Field Component
const InputField = ({ label, required, error, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

// Main Form Modal
export default function ProductFormModal({ product, categories, onClose, onSave }) {
    const [activeTab, setActiveTab] = useState('details');
    const [productId, setProductId] = useState(product?.id || null);
    const [variants, setVariants] = useState(product?.variants || []);
    const [images, setImages] = useState(product?.images || []);
    const [faqs, setFaqs] = useState(product?.faq?.length > 0 ? product.faq : [
        { question: 'Is COD available?', answer: 'No, Cash on Delivery is not available for this product.' },
        { question: 'What is the fabric quality?', answer: 'This product is made from premium quality material ensuring comfort and durability.' },
        { question: 'How do I care for this product?', answer: 'We recommend dry cleaning for best results. Store in a cool, dry place.' },
        { question: 'What is the return policy?', answer: 'We offer a 7-day return policy. The item must be unworn with original tags attached.' },
        { question: 'How long will delivery take?', answer: 'Standard delivery takes 5-7 business days. Express options are also available.' }
    ]);
    const [formData, setFormData] = useState({
        // Basic Info
        name: product?.name || '',
        slug: product?.slug || '',
        description: product?.description || '',
        category_id: product?.category_id || '',

        // Pricing
        price: product?.price || '',
        compare_at_price: product?.compare_at_price || '',
        cost_price: product?.cost_price || '',

        // Inventory
        stock: product?.stock || 0,
        sku: product?.sku || '',

        // Status Flags
        is_published: product?.is_published ?? true,
        is_featured: product?.is_featured || false,
        is_new: product?.is_new || false,

        // Brand & Policy
        brand_by: product?.brand_by || 'shagungallery',
        return_policy: product?.return_policy || '7-day easy returns',

        // SEO
        meta_title: product?.meta_title || '',
        meta_description: product?.meta_description || '',
        tags: product?.tags?.join(', ') || '',

        // Rich Content (JSON)
        fabric_type: product?.fabric?.type || '',
        fabric_composition: product?.fabric?.composition || '',
        shipping_free: product?.shipping?.free ?? true,
        shipping_days: product?.shipping?.estimated_days || 4,

        // GST Settings
        gst_included: product?.gst_included ?? true,
        gst_rate: product?.gst_rate || null,

        // Specifications (detail_description)
        spec_occasion: product?.detail_description?.occasion || '',
        spec_length: product?.detail_description?.length || '',
        spec_origin: product?.detail_description?.origin || 'India',
        spec_contents: product?.detail_description?.contents || '',
        spec_material: product?.detail_description?.material || '',
        spec_pattern: product?.detail_description?.pattern || '',
        spec_work: product?.detail_description?.work || '',
        spec_care: product?.detail_description?.care || '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Sync state when product prop changes (e.g., after async fetch)
    useEffect(() => {
        if (product) {
            setProductId(product.id || null);
            setVariants(product.variants || []);
            setImages(product.images || []);
            setFaqs(product.faq?.length > 0 ? product.faq : [
                { question: 'Is COD available?', answer: 'No, Cash on Delivery is not available for this product.' },
                { question: 'What is the fabric quality?', answer: 'This product is made from premium quality material ensuring comfort and durability.' },
                { question: 'How do I care for this product?', answer: 'We recommend dry cleaning for best results. Store in a cool, dry place.' },
                { question: 'What is the return policy?', answer: 'We offer a 7-day return policy. The item must be unworn with original tags attached.' },
                { question: 'How long will delivery take?', answer: 'Standard delivery takes 5-7 business days. Express options are also available.' }
            ]);
            // Update form data as well
            setFormData(prev => ({
                ...prev,
                name: product.name || prev.name,
                slug: product.slug || prev.slug,
                description: product.description || prev.description,
                category_id: product.category_id || prev.category_id,
                price: product.price || prev.price,
                compare_at_price: product.compare_at_price || prev.compare_at_price,
                cost_price: product.cost_price || prev.cost_price,
                stock: product.stock ?? prev.stock,
                sku: product.sku || prev.sku,
                is_published: product.is_published ?? prev.is_published,
                is_featured: product.is_featured ?? prev.is_featured,
                is_new: product.is_new ?? prev.is_new,
                brand_by: product.brand_by || prev.brand_by,
                return_policy: product.return_policy || prev.return_policy,
                meta_title: product.meta_title || prev.meta_title,
                meta_description: product.meta_description || prev.meta_description,
                tags: product.tags?.join(', ') || prev.tags,
                fabric_type: product.fabric?.type || prev.fabric_type,
                fabric_composition: product.fabric?.composition || prev.fabric_composition,
                shipping_free: product.shipping?.free ?? prev.shipping_free,
                shipping_days: product.shipping?.estimated_days || prev.shipping_days,
                gst_included: product.gst_included ?? prev.gst_included,
                gst_rate: product.gst_rate || prev.gst_rate,
                spec_occasion: product.detail_description?.occasion || prev.spec_occasion,
                spec_length: product.detail_description?.length || prev.spec_length,
                spec_origin: product.detail_description?.origin || prev.spec_origin,
                spec_contents: product.detail_description?.contents || prev.spec_contents,
                spec_material: product.detail_description?.material || prev.spec_material,
                spec_pattern: product.detail_description?.pattern || prev.spec_pattern,
                spec_work: product.detail_description?.work || prev.spec_work,
                spec_care: product.detail_description?.care || prev.spec_care,
            }));
        }
    }, [product]);

    // Generate slug from name
    const generateSlug = () => {
        const slug = formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, slug }));
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Validate form
    const validate = () => {
        const errs = {};
        if (!formData.name?.trim()) errs.name = 'Name is required';
        if (!formData.slug?.trim()) errs.slug = 'Slug is required';
        if (!formData.price || formData.price <= 0) errs.price = 'Valid price is required';
        if (!formData.category_id) errs.category_id = 'Category is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Save product details
    const handleSaveDetails = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            // Build fabric and shipping objects
            const fabric = {
                type: formData.fabric_type || 'Cotton',
                composition: formData.fabric_composition || '100% Cotton'
            };

            const shipping = {
                free: formData.shipping_free,
                estimated_days: parseInt(formData.shipping_days) || 4
            };

            // Parse tags
            const tags = formData.tags
                ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                : [];

            // Build detail_description object for specifications
            const detail_description = {
                occasion: formData.spec_occasion || null,
                length: formData.spec_length || null,
                origin: formData.spec_origin || 'India',
                contents: formData.spec_contents || null,
                material: formData.spec_material || null,
                pattern: formData.spec_pattern || null,
                work: formData.spec_work || null,
                care: formData.spec_care || null,
            };

            const data = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                category_id: parseInt(formData.category_id),
                price: parseFloat(formData.price),
                compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
                cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
                stock: parseInt(formData.stock) || 0,
                sku: formData.sku || null,
                is_published: formData.is_published,
                is_featured: formData.is_featured,
                is_new: formData.is_new,
                brand_by: formData.brand_by,
                return_policy: formData.return_policy,
                meta_title: formData.meta_title || null,
                meta_description: formData.meta_description || null,
                tags,
                fabric,
                shipping,
                detail_description,
                // GST fields
                gst_included: formData.gst_included,
                gst_rate: formData.gst_rate ? parseFloat(formData.gst_rate) : null,
                // FAQ
                faq: faqs.filter(f => f.question?.trim() && f.answer?.trim()),
            };

            let response;
            if (productId) {
                response = await adminApi.updateProduct(productId, data);
            } else {
                response = await adminApi.createProduct(data);
                setProductId(response.data.id);
            }

            setErrors({ success: 'Product saved successfully!' });
            setTimeout(() => setErrors({}), 2000);
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setSaving(false);
        }
    };

    // Refresh product data (for variants/images)
    const refreshProductData = async () => {
        if (!productId) return;
        try {
            const data = await adminApi.getProduct(productId);
            setVariants(data.variants || []);
            setImages(data.images || []);
        } catch (error) {
            console.error('Refresh error:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b shrink-0">
                    <h2 className="text-lg font-bold">
                        {productId ? 'Edit Product' : 'Add New Product'}
                        {productId && <span className="text-gray-400 text-sm ml-2">#{productId}</span>}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b px-4 shrink-0 overflow-x-auto">
                    <TabButton
                        active={activeTab === 'details'}
                        icon={Package}
                        label="Details"
                        onClick={() => setActiveTab('details')}
                    />
                    <TabButton
                        active={activeTab === 'pricing'}
                        icon={Tag}
                        label="Pricing & Stock"
                        onClick={() => setActiveTab('pricing')}
                    />
                    <TabButton
                        active={activeTab === 'seo'}
                        icon={FileText}
                        label="SEO & Meta"
                        onClick={() => setActiveTab('seo')}
                    />
                    <TabButton
                        active={activeTab === 'variants'}
                        icon={Layers}
                        label={`Variants (${variants.length})`}
                        onClick={() => setActiveTab('variants')}
                    />
                    <TabButton
                        active={activeTab === 'images'}
                        icon={ImageIcon}
                        label={`Images (${images.length})`}
                        onClick={() => setActiveTab('images')}
                    />
                    <TabButton
                        active={activeTab === 'faq'}
                        icon={HelpCircle}
                        label={`FAQs (${faqs.length})`}
                        onClick={() => setActiveTab('faq')}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="md:col-span-2">
                                <InputField label="Product Name" required error={errors.name}>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onBlur={() => !formData.slug && generateSlug()}
                                        className={`w-full px-4 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                                        placeholder="Enter product name"
                                    />
                                </InputField>
                            </div>

                            {/* Slug */}
                            <InputField label="URL Slug" required error={errors.slug}>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        className={`flex-1 px-4 py-2 border rounded-lg ${errors.slug ? 'border-red-500' : 'border-gray-200'}`}
                                        placeholder="product-slug"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={generateSlug}>
                                        Generate
                                    </Button>
                                </div>
                            </InputField>

                            {/* Category */}
                            <InputField label="Category" required error={errors.category_id}>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg ${errors.category_id ? 'border-red-500' : 'border-gray-200'}`}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id || cat.category_id} value={cat.id || cat.category_id}>
                                            {cat.name || cat.category}
                                        </option>
                                    ))}
                                </select>
                            </InputField>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <InputField label="Description">
                                    <textarea
                                        name="description"
                                        value={formData.description || ''}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                        placeholder="Product description..."
                                    />
                                </InputField>
                            </div>

                            {/* Brand */}
                            <InputField label="Brand">
                                <input
                                    type="text"
                                    name="brand_by"
                                    value={formData.brand_by}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="Brand name"
                                />
                            </InputField>

                            {/* Return Policy */}
                            <InputField label="Return Policy">
                                <input
                                    type="text"
                                    name="return_policy"
                                    value={formData.return_policy}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="7-day easy returns"
                                />
                            </InputField>

                            {/* Fabric Type */}
                            <InputField label="Fabric Type">
                                <input
                                    type="text"
                                    name="fabric_type"
                                    value={formData.fabric_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="Cotton, Silk, Rayon..."
                                />
                            </InputField>

                            {/* Fabric Composition */}
                            <InputField label="Fabric Composition">
                                <input
                                    type="text"
                                    name="fabric_composition"
                                    value={formData.fabric_composition}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="100% Cotton"
                                />
                            </InputField>

                            {/* Specifications Section */}
                            <div className="md:col-span-2 border-t pt-6 mt-4">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    📋 Product Specifications
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Occasion */}
                                    <InputField label="Occasion">
                                        <input
                                            type="text"
                                            name="spec_occasion"
                                            value={formData.spec_occasion}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="Casual, Festive, Party, Wedding"
                                        />
                                    </InputField>

                                    {/* Length */}
                                    <InputField label="Length">
                                        <input
                                            type="text"
                                            name="spec_length"
                                            value={formData.spec_length}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="Standard, Knee Length, Floor Length"
                                        />
                                    </InputField>

                                    {/* Country of Origin */}
                                    <InputField label="Country of Origin">
                                        <input
                                            type="text"
                                            name="spec_origin"
                                            value={formData.spec_origin}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="India"
                                        />
                                    </InputField>

                                    {/* Package Contents */}
                                    <InputField label="Package Contents">
                                        <input
                                            type="text"
                                            name="spec_contents"
                                            value={formData.spec_contents}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="1 Saree, 1 Blouse Piece"
                                        />
                                    </InputField>

                                    {/* Material */}
                                    <InputField label="Material">
                                        <input
                                            type="text"
                                            name="spec_material"
                                            value={formData.spec_material}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="Pure Silk, Cotton Blend"
                                        />
                                    </InputField>

                                    {/* Pattern */}
                                    <InputField label="Pattern">
                                        <input
                                            type="text"
                                            name="spec_pattern"
                                            value={formData.spec_pattern}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="Traditional, Printed, Embroidered"
                                        />
                                    </InputField>

                                    {/* Work Type */}
                                    <InputField label="Work Type">
                                        <input
                                            type="text"
                                            name="spec_work"
                                            value={formData.spec_work}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="Handcrafted, Zari Work, Embroidery"
                                        />
                                    </InputField>

                                    {/* Care Instructions */}
                                    <InputField label="Care Instructions">
                                        <input
                                            type="text"
                                            name="spec_care"
                                            value={formData.spec_care}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="Dry clean only, Hand wash"
                                        />
                                    </InputField>
                                </div>
                            </div>

                            {/* Status Toggles */}
                            <div className="md:col-span-2 flex flex-wrap gap-6 p-4 bg-gray-50 rounded-xl">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_published"
                                        checked={formData.is_published}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary rounded"
                                    />
                                    <span className="text-sm font-medium">Published</span>
                                    <Badge variant={formData.is_published ? 'success' : 'ghost'} size="sm">
                                        {formData.is_published ? 'Visible' : 'Hidden'}
                                    </Badge>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_featured"
                                        checked={formData.is_featured}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary rounded"
                                    />
                                    <span className="text-sm font-medium">Featured</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_new"
                                        checked={formData.is_new}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary rounded"
                                    />
                                    <span className="text-sm font-medium">New Arrival</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="shipping_free"
                                        checked={formData.shipping_free}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary rounded"
                                    />
                                    <span className="text-sm font-medium">Free Shipping</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Pricing & Stock Tab */}
                    {activeTab === 'pricing' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Price */}
                            <InputField label="Price (₹)" required error={errors.price}>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-4 py-2 border rounded-lg ${errors.price ? 'border-red-500' : 'border-gray-200'}`}
                                />
                            </InputField>

                            {/* Compare Price */}
                            <InputField label="Compare at Price (₹)">
                                <input
                                    type="number"
                                    name="compare_at_price"
                                    value={formData.compare_at_price || ''}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="Original price for discount display"
                                />
                            </InputField>

                            {/* Cost Price */}
                            <InputField label="Cost Price (₹)">
                                <input
                                    type="number"
                                    name="cost_price"
                                    value={formData.cost_price || ''}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="Your cost (not shown to customers)"
                                />
                            </InputField>

                            {/* Stock */}
                            <InputField label="Stock Quantity">
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                />
                            </InputField>

                            {/* SKU */}
                            <InputField label="SKU">
                                <input
                                    type="text"
                                    name="sku"
                                    value={formData.sku || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="SKU-001"
                                />
                            </InputField>

                            {/* Shipping Days */}
                            <InputField label="Estimated Shipping Days">
                                <input
                                    type="number"
                                    name="shipping_days"
                                    value={formData.shipping_days}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                />
                            </InputField>

                            {/* Profit Calculation */}
                            {formData.price && formData.cost_price && (
                                <div className="md:col-span-3 p-4 bg-green-50 rounded-xl">
                                    <p className="text-sm text-green-700">
                                        <strong>Profit Margin:</strong> ₹{(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)}
                                        ({((1 - parseFloat(formData.cost_price) / parseFloat(formData.price)) * 100).toFixed(1)}%)
                                    </p>
                                </div>
                            )}

                            {/* GST Settings Section */}
                            <div className="md:col-span-3 border-t pt-6 mt-4">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    💰 GST Settings
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* GST Toggle */}
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div>
                                                <span className="text-sm font-medium">GST Included in Price</span>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formData.gst_included
                                                        ? 'Price shown includes GST (no extra tax at checkout)'
                                                        : 'GST will be calculated and added at checkout'
                                                    }
                                                </p>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    name="gst_included"
                                                    checked={formData.gst_included}
                                                    onChange={handleChange}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </div>
                                        </label>
                                        <Badge variant={formData.gst_included ? 'success' : 'warning'} size="sm" className="mt-2">
                                            {formData.gst_included ? 'GST Included' : 'GST Extra'}
                                        </Badge>
                                    </div>

                                    {/* Custom GST Rate */}
                                    <InputField label="Custom GST Rate (%)">
                                        <input
                                            type="number"
                                            name="gst_rate"
                                            value={formData.gst_rate || ''}
                                            onChange={handleChange}
                                            min="0"
                                            max="28"
                                            step="0.1"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="Leave empty for auto (based on price)"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Auto-rate: {(() => {
                                                const price = parseFloat(formData.price) || 0;
                                                if (price <= 1000) return '5%';
                                                return '18%';
                                            })()}
                                        </p>
                                    </InputField>
                                </div>

                                {/* GST Rate Chart */}
                                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                                    <h4 className="font-medium text-blue-900 mb-3">📊 Default GST Rate Chart</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-blue-200">
                                                    <th className="text-left py-2 px-3 font-semibold text-blue-800">Price Range</th>
                                                    <th className="text-center py-2 px-3 font-semibold text-blue-800">GST Rate</th>
                                                    <th className="text-left py-2 px-3 font-semibold text-blue-800">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-blue-700">
                                                <tr className={`border-b border-blue-100 ${parseFloat(formData.price) <= 1000 ? 'bg-blue-100' : ''}`}>
                                                    <td className="py-2 px-3">₹0 - ₹1,000</td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">5%</span>
                                                    </td>
                                                    <td className="py-2 px-3">Basic GST rate</td>
                                                </tr>
                                                <tr className={parseFloat(formData.price) > 1000 ? 'bg-blue-100' : ''}>
                                                    <td className="py-2 px-3">Above ₹1,000</td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">18%</span>
                                                    </td>
                                                    <td className="py-2 px-3">Standard GST rate</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    {formData.gst_rate && (
                                        <p className="mt-2 text-xs text-blue-600">
                                            ℹ️ Custom rate ({formData.gst_rate}%) will override the default chart rate
                                        </p>
                                    )}
                                </div>

                                {/* Price Preview with GST */}
                                {formData.price && !formData.gst_included && (
                                    <div className="mt-4 p-4 bg-amber-50 rounded-xl">
                                        <h4 className="font-medium text-amber-900 mb-2">Checkout Price Preview</h4>
                                        {(() => {
                                            const price = parseFloat(formData.price) || 0;
                                            let gstRate = formData.gst_rate ? parseFloat(formData.gst_rate) : 0;
                                            if (!formData.gst_rate) {
                                                if (price <= 1000) gstRate = 5;
                                                else gstRate = 18;
                                            }
                                            const gstAmount = (price * gstRate / 100);
                                            const totalPrice = price + gstAmount;
                                            return (
                                                <div className="space-y-1 text-sm text-amber-700">
                                                    <div className="flex justify-between">
                                                        <span>Base Price:</span>
                                                        <span>₹{price.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>GST ({gstRate}%):</span>
                                                        <span>+₹{gstAmount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold border-t border-amber-200 pt-1">
                                                        <span>Total at Checkout:</span>
                                                        <span>₹{totalPrice.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SEO Tab */}
                    {activeTab === 'seo' && (
                        <div className="space-y-4">
                            <InputField label="Meta Title">
                                <input
                                    type="text"
                                    name="meta_title"
                                    value={formData.meta_title || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="SEO title for search engines"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {(formData.meta_title || '').length}/60 characters
                                </p>
                            </InputField>

                            <InputField label="Meta Description">
                                <textarea
                                    name="meta_description"
                                    value={formData.meta_description || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="SEO description for search engines"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {(formData.meta_description || '').length}/160 characters
                                </p>
                            </InputField>

                            <InputField label="Tags (comma separated)">
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="bridal, lehenga, wedding, ethnic"
                                />
                            </InputField>

                            {/* Preview */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 mb-2">Search Engine Preview</p>
                                <p className="text-blue-600 font-medium">
                                    {formData.meta_title || formData.name || 'Product Title'}
                                </p>
                                <p className="text-green-700 text-sm">
                                    shagungallery.com/products/{formData.slug || 'product-slug'}
                                </p>
                                <p className="text-gray-600 text-sm">
                                    {formData.meta_description || formData.description || 'Product description will appear here...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Variants Tab */}
                    {activeTab === 'variants' && (
                        <VariantManager
                            productId={productId}
                            variants={variants}
                            onUpdate={refreshProductData}
                        />
                    )}

                    {/* Images Tab */}
                    {activeTab === 'images' && (
                        <ImageManager
                            productId={productId}
                            images={images}
                            variants={variants}
                            onUpdate={refreshProductData}
                        />
                    )}

                    {/* FAQ Tab */}
                    {activeTab === 'faq' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
                                    <p className="text-sm text-gray-500">Add custom FAQs for this product</p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
                                    leftIcon={<Plus className="w-4 h-4" />}
                                >
                                    Add FAQ
                                </Button>
                            </div>

                            {faqs.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl">
                                    <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No FAQs added yet</p>
                                    <p className="text-sm text-gray-400">Click "Add FAQ" to create your first question</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {faqs.map((faq, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1 space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Question {idx + 1}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={faq.question}
                                                            onChange={(e) => {
                                                                const newFaqs = [...faqs];
                                                                newFaqs[idx].question = e.target.value;
                                                                setFaqs(newFaqs);
                                                            }}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                            placeholder="Enter question"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Answer
                                                        </label>
                                                        <textarea
                                                            value={faq.answer}
                                                            onChange={(e) => {
                                                                const newFaqs = [...faqs];
                                                                newFaqs[idx].answer = e.target.value;
                                                                setFaqs(newFaqs);
                                                            }}
                                                            rows={2}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                            placeholder="Enter answer"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newFaqs = faqs.filter((_, i) => i !== idx);
                                                        setFaqs(newFaqs);
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Default FAQs Info */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <h4 className="font-medium text-blue-800 mb-2">💡 Default FAQs</h4>
                                <p className="text-sm text-blue-700">
                                    If no FAQs are added, the product will show default FAQs including COD availability,
                                    fabric quality, care instructions, and return policy.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t bg-gray-50 shrink-0">
                    <div>
                        {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}
                        {errors.success && <p className="text-green-500 text-sm">{errors.success}</p>}
                        {!productId && (activeTab === 'variants' || activeTab === 'images') && (
                            <p className="text-amber-600 text-sm">Save product details first to add variants/images</p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        {(activeTab === 'details' || activeTab === 'pricing' || activeTab === 'seo' || activeTab === 'faq') && (
                            <Button onClick={handleSaveDetails} loading={saving} leftIcon={<Save className="w-4 h-4" />}>
                                {productId ? 'Update Product' : 'Create Product'}
                            </Button>
                        )}
                        {productId && (activeTab === 'variants' || activeTab === 'images') && (
                            <Button onClick={() => { onSave(); onClose(); }}>
                                Done
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
