import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Save, X,
    Image as ImageIcon, Palette, Type, Link as LinkIcon, DollarSign,
    Settings, RefreshCw, ChevronDown, ChevronUp, Upload, Check
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';

// Gradient presets for easy selection
const GRADIENT_PRESETS = [
    { name: 'Rose Pink', value: 'from-rose-600 via-pink-500 to-fuchsia-500' },
    { name: 'Purple Violet', value: 'from-purple-600 via-violet-500 to-indigo-500' },
    { name: 'Amber Orange', value: 'from-amber-500 via-orange-500 to-red-500' },
    { name: 'Teal Cyan', value: 'from-teal-500 via-cyan-500 to-blue-500' },
    { name: 'Green Emerald', value: 'from-green-500 via-emerald-500 to-teal-500' },
    { name: 'Pink Purple', value: 'from-pink-500 via-purple-500 to-indigo-500' },
    { name: 'Red Rose', value: 'from-red-500 via-rose-500 to-pink-500' },
    { name: 'Blue Indigo', value: 'from-blue-500 via-indigo-500 to-purple-500' },
];

// Default slide template
const DEFAULT_SLIDE = {
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    badge_text: '',
    gradient: 'from-rose-600 via-pink-500 to-fuchsia-500',
    button_text: 'Shop Now',
    button_link: '/products',
    secondary_button_text: 'Sign Up',
    secondary_button_link: '/account',
    starting_price: '',
    price_label: 'Starting from',
    is_active: true
};

export default function HeroAdmin() {
    const { token } = useAuth();
    const [slides, setSlides] = useState([]);
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState(null);
    const [formData, setFormData] = useState(DEFAULT_SLIDE);

    // Settings panel
    const [showSettings, setShowSettings] = useState(false);
    const [settingsForm, setSettingsForm] = useState({});

    // Fetch slides and settings
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [slidesRes, settingsRes] = await Promise.all([
                api.getHeroSlidesAdmin(token),
                api.getHeroSettingsAdmin(token)
            ]);

            if (slidesRes.success) {
                setSlides(slidesRes.data || []);
            }

            if (settingsRes.success) {
                setSettings(settingsRes.data || []);
                // Convert settings array to form object
                const settingsObj = {};
                (settingsRes.data || []).forEach(s => {
                    settingsObj[s.setting_key] = s.setting_value;
                });
                setSettingsForm(settingsObj);
            }
        } catch (err) {
            console.error('Error fetching hero data:', err);
            setError(err.message || 'Failed to load hero data');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle form changes
    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Open modal for new slide
    const handleAddNew = () => {
        setEditingSlide(null);
        setFormData(DEFAULT_SLIDE);
        setIsModalOpen(true);
    };

    // Open modal to edit slide
    const handleEdit = (slide) => {
        setEditingSlide(slide);
        setFormData({
            title: slide.title || '',
            subtitle: slide.subtitle || '',
            description: slide.description || '',
            image_url: slide.image_url || '',
            badge_text: slide.badge_text || '',
            gradient: slide.gradient || 'from-rose-600 via-pink-500 to-fuchsia-500',
            button_text: slide.button_text || 'Shop Now',
            button_link: slide.button_link || '/products',
            secondary_button_text: slide.secondary_button_text || '',
            secondary_button_link: slide.secondary_button_link || '',
            starting_price: slide.starting_price || '',
            price_label: slide.price_label || 'Starting from',
            is_active: slide.is_active ?? true
        });
        setIsModalOpen(true);
    };

    // Save slide (create or update)
    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            if (!formData.title || !formData.image_url) {
                setError('Title and Image URL are required');
                return;
            }

            let result;
            if (editingSlide) {
                result = await api.updateHeroSlide(editingSlide.id, formData, token);
            } else {
                result = await api.createHeroSlide(formData, token);
            }

            if (result.success) {
                setSuccess(editingSlide ? 'Slide updated successfully!' : 'Slide created successfully!');
                setIsModalOpen(false);
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to save slide');
        } finally {
            setSaving(false);
        }
    };

    // Delete slide
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this slide?')) return;

        try {
            const result = await api.deleteHeroSlide(id, token);
            if (result.success) {
                setSuccess('Slide deleted successfully!');
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to delete slide');
        }
    };

    // Toggle slide active status
    const handleToggle = async (id) => {
        try {
            const result = await api.toggleHeroSlide(id, token);
            if (result.success) {
                fetchData();
            }
        } catch (err) {
            setError(err.message || 'Failed to toggle slide');
        }
    };

    // Reorder slides
    const handleReorder = async (newOrder) => {
        setSlides(newOrder);
        try {
            const slideIds = newOrder.map(s => s.id);
            await api.reorderHeroSlides(slideIds, token);
        } catch (err) {
            console.error('Error reordering slides:', err);
            fetchData(); // Revert on error
        }
    };

    // Save settings
    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            const settingsArray = Object.entries(settingsForm).map(([key, value]) => ({
                key,
                value,
                type: 'string'
            }));

            const result = await api.bulkUpdateHeroSettings(settingsArray, token);
            if (result.success) {
                setSuccess('Settings saved successfully!');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hero Banners</h1>
                        <p className="text-gray-500 mt-1">Manage homepage hero section slides and settings</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showSettings ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Slide
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between"
                        >
                            <span>{error}</span>
                            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Settings Panel */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="bg-white rounded-xl border p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-primary" />
                                    Homepage Settings
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                                        <input
                                            type="text"
                                            value={settingsForm.brand_name || ''}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, brand_name: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand Tagline</label>
                                        <input
                                            type="text"
                                            value={settingsForm.brand_tagline || ''}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, brand_tagline: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                                        <input
                                            type="text"
                                            value={settingsForm.logo_url || ''}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, logo_url: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Auto Slide Interval (ms)</label>
                                        <input
                                            type="number"
                                            value={settingsForm.auto_slide_interval || '5000'}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, auto_slide_interval: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Count Text</label>
                                        <input
                                            type="text"
                                            value={settingsForm.customer_count_text || ''}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, customer_count_text: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating Value</label>
                                        <input
                                            type="text"
                                            value={settingsForm.rating_value || ''}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, rating_value: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                </div>

                                {/* Trust Badges */}
                                <h4 className="text-md font-medium mt-6 mb-3">Trust Badges</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Icon (emoji)"
                                                value={settingsForm[`trust_badge_${i}_icon`] || ''}
                                                onChange={(e) => setSettingsForm(prev => ({ ...prev, [`trust_badge_${i}_icon`]: e.target.value }))}
                                                className="w-16 px-3 py-2 border rounded-lg text-center"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Text"
                                                value={settingsForm[`trust_badge_${i}_text`] || ''}
                                                onChange={(e) => setSettingsForm(prev => ({ ...prev, [`trust_badge_${i}_text`]: e.target.value }))}
                                                className="flex-1 px-3 py-2 border rounded-lg"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Slides List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : slides.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border">
                        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Hero Slides</h3>
                        <p className="text-gray-500 mb-4">Create your first hero banner slide</p>
                        <button
                            onClick={handleAddNew}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Slide
                        </button>
                    </div>
                ) : (
                    <Reorder.Group axis="y" values={slides} onReorder={handleReorder} className="space-y-4">
                        {slides.map((slide) => (
                            <Reorder.Item key={slide.id} value={slide}>
                                <motion.div
                                    layout
                                    className={`bg-white rounded-xl border overflow-hidden ${!slide.is_active ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex items-stretch">
                                        {/* Drag Handle */}
                                        <div className="flex items-center justify-center w-12 bg-gray-50 border-r cursor-grab active:cursor-grabbing">
                                            <GripVertical className="w-5 h-5 text-gray-400" />
                                        </div>

                                        {/* Image Preview */}
                                        <div className="w-32 h-24 flex-shrink-0 relative overflow-hidden">
                                            <img
                                                src={slide.image_url}
                                                alt={slide.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} opacity-30`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900">{slide.title}</h3>
                                                        {slide.badge_text && (
                                                            <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full bg-gradient-to-r ${slide.gradient}`}>
                                                                {slide.badge_text}
                                                            </span>
                                                        )}
                                                        {!slide.is_active && (
                                                            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                                                                Hidden
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">{slide.subtitle}</p>
                                                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{slide.description}</p>
                                                </div>

                                                {/* Price */}
                                                {slide.starting_price && (
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">{slide.price_label}</p>
                                                        <p className="font-bold text-lg text-gray-900">₹{slide.starting_price}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 px-4 border-l">
                                            <button
                                                onClick={() => handleToggle(slide.id)}
                                                className={`p-2 rounded-lg transition-colors ${slide.is_active ? 'hover:bg-gray-100' : 'hover:bg-green-50 text-green-600'}`}
                                                title={slide.is_active ? 'Hide slide' : 'Show slide'}
                                            >
                                                {slide.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(slide)}
                                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                title="Edit slide"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(slide.id)}
                                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                                title="Delete slide"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}

                {/* Edit/Create Modal */}
                <AnimatePresence>
                    {isModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsModalOpen(false)}
                                className="fixed inset-0 bg-black/50 z-40"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-4 md:inset-10 lg:inset-20 bg-white rounded-2xl z-50 overflow-hidden flex flex-col"
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b">
                                    <h2 className="text-xl font-bold">
                                        {editingSlide ? 'Edit Hero Slide' : 'Create New Slide'}
                                    </h2>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Form Fields */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    <Type className="w-4 h-4 inline mr-1" />
                                                    Title *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={(e) => handleFormChange('title', e.target.value)}
                                                    placeholder="e.g., Festive Glamour"
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                                                <input
                                                    type="text"
                                                    value={formData.subtitle}
                                                    onChange={(e) => handleFormChange('subtitle', e.target.value)}
                                                    placeholder="e.g., ✨ New Collection 2025"
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => handleFormChange('description', e.target.value)}
                                                    placeholder="Brief description..."
                                                    rows={2}
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    <ImageIcon className="w-4 h-4 inline mr-1" />
                                                    Image URL *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.image_url}
                                                    onChange={(e) => handleFormChange('image_url', e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                                                <input
                                                    type="text"
                                                    value={formData.badge_text}
                                                    onChange={(e) => handleFormChange('badge_text', e.target.value)}
                                                    placeholder="e.g., Trending Now, Best Seller"
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <Palette className="w-4 h-4 inline mr-1" />
                                                    Gradient Theme
                                                </label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {GRADIENT_PRESETS.map((preset) => (
                                                        <button
                                                            key={preset.value}
                                                            type="button"
                                                            onClick={() => handleFormChange('gradient', preset.value)}
                                                            className={`h-10 rounded-lg bg-gradient-to-r ${preset.value} transition-all ${formData.gradient === preset.value
                                                                    ? 'ring-2 ring-offset-2 ring-primary scale-105'
                                                                    : 'hover:scale-105'
                                                                }`}
                                                            title={preset.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                                                    <input
                                                        type="text"
                                                        value={formData.button_text}
                                                        onChange={(e) => handleFormChange('button_text', e.target.value)}
                                                        placeholder="Shop Now"
                                                        className="w-full px-4 py-2 border rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
                                                    <input
                                                        type="text"
                                                        value={formData.button_link}
                                                        onChange={(e) => handleFormChange('button_link', e.target.value)}
                                                        placeholder="/products"
                                                        className="w-full px-4 py-2 border rounded-lg"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button</label>
                                                    <input
                                                        type="text"
                                                        value={formData.secondary_button_text}
                                                        onChange={(e) => handleFormChange('secondary_button_text', e.target.value)}
                                                        placeholder="Sign Up"
                                                        className="w-full px-4 py-2 border rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Link</label>
                                                    <input
                                                        type="text"
                                                        value={formData.secondary_button_link}
                                                        onChange={(e) => handleFormChange('secondary_button_link', e.target.value)}
                                                        placeholder="/account"
                                                        className="w-full px-4 py-2 border rounded-lg"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                                        Starting Price
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={formData.starting_price}
                                                        onChange={(e) => handleFormChange('starting_price', e.target.value)}
                                                        placeholder="999"
                                                        className="w-full px-4 py-2 border rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Label</label>
                                                    <input
                                                        type="text"
                                                        value={formData.price_label}
                                                        onChange={(e) => handleFormChange('price_label', e.target.value)}
                                                        placeholder="Starting from"
                                                        className="w-full px-4 py-2 border rounded-lg"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_active"
                                                    checked={formData.is_active}
                                                    onChange={(e) => handleFormChange('is_active', e.target.checked)}
                                                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                                                />
                                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                                    Active (visible on homepage)
                                                </label>
                                            </div>
                                        </div>

                                        {/* Live Preview */}
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">Live Preview</h3>
                                            <div className="rounded-xl overflow-hidden border shadow-lg">
                                                <div className="aspect-[4/3] relative bg-gradient-to-br from-white via-purple-50 to-pink-50">
                                                    {formData.image_url ? (
                                                        <img
                                                            src={formData.image_url}
                                                            alt="Preview"
                                                            className="absolute inset-0 w-full h-full object-cover"
                                                            onError={(e) => e.target.style.display = 'none'}
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <ImageIcon className="w-16 h-16 text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                                    {/* Content Overlay */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                                        {formData.badge_text && (
                                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${formData.gradient} mb-2`}>
                                                                {formData.badge_text}
                                                            </span>
                                                        )}
                                                        <p className="text-pink-200 text-sm mb-1">{formData.subtitle || 'Subtitle'}</p>
                                                        <h3 className={`text-3xl font-black bg-gradient-to-r ${formData.gradient} bg-clip-text text-transparent`}>
                                                            {formData.title || 'Title'}
                                                        </h3>
                                                        <p className="text-white/80 text-sm mt-2 line-clamp-2">
                                                            {formData.description || 'Description text...'}
                                                        </p>

                                                        {formData.starting_price && (
                                                            <div className="mt-3 inline-block bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                                                                <p className="text-gray-500 text-xs">{formData.price_label}</p>
                                                                <p className="text-gray-900 font-bold">₹{formData.starting_price}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {editingSlide ? 'Save Changes' : 'Create Slide'}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}
