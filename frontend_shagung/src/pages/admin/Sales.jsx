// Admin Sales Page - Manage sale campaigns and products on sale
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Flame, Plus, Trash2, Edit, Calendar, Clock, Search,
    Package, Tag, Eye, EyeOff, X, Check, Loader2,
    AlertCircle, ChevronDown, ChevronUp, Image, Palette, Settings, Upload, Globe
} from 'lucide-react'
import AdminLayout from './AdminLayout'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ToastContext'

// Preset gradient colors for quick selection
const presetColors = [
    { name: 'Rose', value: 'linear-gradient(135deg, #e91e63, #9c27b0)' },
    { name: 'Orange Fire', value: 'linear-gradient(135deg, #ff5722, #e91e63)' },
    { name: 'Blue Ocean', value: 'linear-gradient(135deg, #2196f3, #00bcd4)' },
    { name: 'Green Forest', value: 'linear-gradient(135deg, #4caf50, #009688)' },
    { name: 'Purple Night', value: 'linear-gradient(135deg, #673ab7, #3f51b5)' },
    { name: 'Golden', value: 'linear-gradient(135deg, #ff9800, #ffc107)' },
    { name: 'Black Friday', value: 'linear-gradient(135deg, #212121, #424242)' },
    { name: 'Solid Pink', value: '#e91e63' },
    { name: 'Solid Red', value: '#f44336' },
    { name: 'Solid Blue', value: '#2196f3' },
]

// Timezone options
const timezoneOptions = [
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

// =============================================================================
// SALE FORM MODAL
// =============================================================================
const SaleFormModal = ({ isOpen, onClose, sale, onSave }) => {
    const { token } = useAuth()
    const { showToast } = useToast()
    const bannerInputRef = useRef(null)
    const bgInputRef = useRef(null)

    const [activeTab, setActiveTab] = useState('basic')
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        badge_text: 'SALE',
        discount_percentage: 20,
        start_date: '',
        end_date: '',
        is_active: true,
        priority: 0,
        // New fields
        banner_image: '',
        background_image: '',
        background_color: 'linear-gradient(135deg, #e91e63, #9c27b0)',
        offer_heading: 'Limited Time Offer',
        offer_subheading: '',
        timezone: 'Asia/Kolkata',
        show_countdown: true,
        show_products_count: true,
        cta_text: 'Shop Now',
        cta_link: '/sale'
    })
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(null)

    useEffect(() => {
        if (sale) {
            setFormData({
                name: sale.name || '',
                slug: sale.slug || '',
                description: sale.description || '',
                badge_text: sale.badge_text || 'SALE',
                discount_percentage: sale.discount_percentage || 20,
                start_date: sale.start_date ? new Date(sale.start_date).toISOString().slice(0, 16) : '',
                end_date: sale.end_date ? new Date(sale.end_date).toISOString().slice(0, 16) : '',
                is_active: sale.is_active !== false,
                priority: sale.priority || 0,
                // New fields
                banner_image: sale.banner_image || '',
                background_image: sale.background_image || '',
                background_color: sale.background_color || 'linear-gradient(135deg, #e91e63, #9c27b0)',
                offer_heading: sale.offer_heading || 'Limited Time Offer',
                offer_subheading: sale.offer_subheading || '',
                timezone: sale.timezone || 'Asia/Kolkata',
                show_countdown: sale.show_countdown !== false,
                show_products_count: sale.show_products_count !== false,
                cta_text: sale.cta_text || 'Shop Now',
                cta_link: sale.cta_link || '/sale'
            })
        } else {
            // Set defaults for new sale
            const now = new Date()
            const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            setFormData({
                name: '',
                slug: '',
                description: '',
                badge_text: 'SALE',
                discount_percentage: 20,
                start_date: now.toISOString().slice(0, 16),
                end_date: endDate.toISOString().slice(0, 16),
                is_active: true,
                priority: 0,
                banner_image: '',
                background_image: '',
                background_color: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                offer_heading: 'Limited Time Offer',
                offer_subheading: '',
                timezone: 'Asia/Kolkata',
                show_countdown: true,
                show_products_count: true,
                cta_text: 'Shop Now',
                cta_link: '/sale'
            })
        }
        setActiveTab('basic')
    }, [sale, isOpen])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSave(formData)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const generateSlug = (name) => {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
    }

    const handleImageUpload = async (file, field) => {
        if (!file) return

        setUploading(field)
        try {
            const formDataUpload = new FormData()
            formDataUpload.append('image', file)

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formDataUpload
            })

            if (response.ok) {
                const data = await response.json()
                setFormData(prev => ({ ...prev, [field]: data.url || data.imageUrl }))
                showToast('Image uploaded successfully!', 'success')
            } else {
                throw new Error('Upload failed')
            }
        } catch (err) {
            showToast('Failed to upload image', 'error')
        } finally {
            setUploading(null)
        }
    }

    if (!isOpen) return null

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: Tag },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'display', label: 'Display Settings', icon: Settings },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div
                    className="p-4 flex items-center justify-between"
                    style={{ background: formData.background_color }}
                >
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Flame className="w-5 h-5" />
                        {sale ? 'Edit Sale' : 'Create New Sale'}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                                slug: formData.slug || generateSlug(e.target.value)
                                            })
                                        }}
                                        required
                                        placeholder="e.g. Summer Sale 2024"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        required
                                        placeholder="summer-sale-2024"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                                    <input
                                        type="text"
                                        value={formData.badge_text}
                                        onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                                        placeholder="SALE"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount % (Global)</label>
                                    <input
                                        type="number"
                                        value={formData.discount_percentage}
                                        onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                                        min="0"
                                        max="100"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Applies to all products added to this sale (Sale Price = Current Price - Discount%)</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    placeholder="Shop amazing products at special prices!"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-5 h-5 text-orange-500 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Active</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">Priority:</label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                        className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <>
                            {/* Banner Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                                <div className="flex gap-4">
                                    <div
                                        className="relative w-32 h-20 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-500"
                                        onClick={() => bannerInputRef.current?.click()}
                                    >
                                        {formData.banner_image ? (
                                            <img src={formData.banner_image} alt="Banner" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <Image className="w-6 h-6 text-gray-400 mx-auto" />
                                                <span className="text-xs text-gray-400">Upload</span>
                                            </div>
                                        )}
                                        {uploading === 'banner_image' && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'banner_image')}
                                    />
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={formData.banner_image}
                                            onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                                            placeholder="Or paste image URL..."
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Recommended size: 1200x400px</p>
                                    </div>
                                </div>
                            </div>

                            {/* Background Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
                                <div className="flex gap-4">
                                    <div
                                        className="relative w-32 h-20 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-500"
                                        onClick={() => bgInputRef.current?.click()}
                                    >
                                        {formData.background_image ? (
                                            <img src={formData.background_image} alt="Background" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <Image className="w-6 h-6 text-gray-400 mx-auto" />
                                                <span className="text-xs text-gray-400">Upload</span>
                                            </div>
                                        )}
                                        {uploading === 'background_image' && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={bgInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background_image')}
                                    />
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={formData.background_image}
                                            onChange={(e) => setFormData({ ...formData, background_image: e.target.value })}
                                            placeholder="Or paste image URL..."
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Will be used as hero section background</p>
                                    </div>
                                </div>
                            </div>

                            {/* Background Color */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Background Color / Gradient</label>
                                <div className="grid grid-cols-5 gap-2 mb-3">
                                    {presetColors.map((color, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, background_color: color.value })}
                                            className={`h-10 rounded-lg border-2 transition-all ${formData.background_color === color.value
                                                ? 'border-gray-900 scale-105'
                                                : 'border-transparent hover:border-gray-300'
                                                }`}
                                            style={{ background: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={formData.background_color}
                                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                                    placeholder="CSS color or gradient..."
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                                <div
                                    className="h-24 rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden"
                                    style={{
                                        background: formData.background_image
                                            ? `url(${formData.background_image}) center/cover`
                                            : formData.background_color
                                    }}
                                >
                                    <div className="bg-black/30 px-6 py-3 rounded-lg backdrop-blur-sm">
                                        {formData.name || 'Sale Preview'}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Display Settings Tab */}
                    {activeTab === 'display' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Offer Heading</label>
                                    <input
                                        type="text"
                                        value={formData.offer_heading}
                                        onChange={(e) => setFormData({ ...formData, offer_heading: e.target.value })}
                                        placeholder="Limited Time Offer"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Offer Subheading</label>
                                    <input
                                        type="text"
                                        value={formData.offer_subheading}
                                        onChange={(e) => setFormData({ ...formData, offer_subheading: e.target.value })}
                                        placeholder="Don't miss out on these amazing deals!"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                                            /sale/
                                        </span>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            required
                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                                    <input
                                        type="text"
                                        value={formData.badge_text}
                                        onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                                        placeholder="SALE"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount % (Global)</label>
                                    <input
                                        type="number"
                                        value={formData.discount_percentage}
                                        onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                                        min="0"
                                        max="100"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Applies to all products in this sale</p>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        placeholder="A brief description of the sale..."
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                                    <input
                                        type="text"
                                        value={formData.cta_text}
                                        onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                                        placeholder="Shop Now"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Link</label>
                                    <input
                                        type="text"
                                        value={formData.cta_link}
                                        onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                                        placeholder="/sale"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Globe className="w-4 h-4 inline mr-1" />
                                    Timezone
                                </label>
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                >
                                    {timezoneOptions.map(tz => (
                                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Countdown timer will use this timezone</p>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_countdown}
                                        onChange={(e) => setFormData({ ...formData, show_countdown: e.target.checked })}
                                        className="w-5 h-5 text-orange-500 rounded"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Show Countdown Timer</span>
                                        <p className="text-xs text-gray-400">Display days/hours/minutes countdown</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_products_count}
                                        onChange={(e) => setFormData({ ...formData, show_products_count: e.target.checked })}
                                        className="w-5 h-5 text-orange-500 rounded"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Show Products Count</span>
                                        <p className="text-xs text-gray-400">Display number of products on sale</p>
                                    </div>
                                </label>
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {sale ? 'Update Sale' : 'Create Sale'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

// =============================================================================
// ADD PRODUCTS MODAL
// =============================================================================
const AddProductsModal = ({ isOpen, onClose, sale, onProductsAdded }) => {
    const { token } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState(new Set())
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchProducts()
        }
    }, [isOpen])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const res = await api.products({ limit: 100 })
            setProducts(res.products || [])
        } catch (err) {
            console.error('Failed to fetch products:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddProducts = async () => {
        if (selectedProducts.size === 0) return

        setSaving(true)
        try {
            await api.bulkAddProductsToSale({
                saleId: sale.id,
                productIds: Array.from(selectedProducts),
                discountPercentage: sale.discount_percentage
            }, token)
            onProductsAdded()
            onClose()
        } catch (err) {
            console.error('Failed to add products:', err)
        } finally {
            setSaving(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Add Products to {sale?.name}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl"
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                    </p>
                </div>

                <div className="max-h-96 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                        </div>
                    ) : (
                        filteredProducts.map(product => (
                            <label
                                key={product.id}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedProducts.has(product.id)
                                    ? 'bg-pink-50 border-2 border-pink-500'
                                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedProducts.has(product.id)}
                                    onChange={(e) => {
                                        const newSet = new Set(selectedProducts)
                                        if (e.target.checked) {
                                            newSet.add(product.id)
                                        } else {
                                            newSet.delete(product.id)
                                        }
                                        setSelectedProducts(newSet)
                                    }}
                                    className="w-5 h-5 text-pink-500 rounded"
                                />
                                <img
                                    src={product.image || product.images?.[0]?.image_url || 'https://via.placeholder.com/50'}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                                    <p className="text-sm text-gray-500">₹{product.price}</p>
                                </div>
                            </label>
                        ))
                    )}
                </div>

                <div className="flex gap-3 p-4 border-t">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddProducts}
                        disabled={saving || selectedProducts.size === 0}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add {selectedProducts.size} Products
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

// =============================================================================
// SALE CARD
// =============================================================================
const SaleCard = ({ sale, onEdit, onDelete, onManageProducts, expanded, onToggleExpand }) => {
    const now = new Date()
    const startDate = new Date(sale.start_date)
    const endDate = new Date(sale.end_date)
    const isActive = sale.is_active && startDate <= now && endDate >= now
    const isUpcoming = startDate > now
    const isExpired = endDate < now

    return (
        <motion.div
            layout
            className={`bg-white rounded-2xl border overflow-hidden ${isActive ? 'border-green-200' : isExpired ? 'border-gray-200' : 'border-blue-200'
                }`}
        >
            <div
                className="p-4 cursor-pointer"
                onClick={() => onToggleExpand(sale.id)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Use sale's background color if set */}
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                            style={{
                                background: sale.background_color || (isActive ? 'linear-gradient(135deg, #f97316, #ef4444)' :
                                    isUpcoming ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' :
                                        '#e5e7eb')
                            }}
                        >
                            {sale.banner_image ? (
                                <img src={sale.banner_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Flame className={`w-6 h-6 ${isActive || isUpcoming ? 'text-white' : 'text-gray-400'}`} />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{sale.name}</h3>
                            <div className="flex items-center gap-2 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' :
                                    isUpcoming ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                    {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Expired'}
                                </span>
                                <span className="text-gray-500">{sale.product_count || 0} products</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {sale.badge_text && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                                {sale.badge_text}
                            </span>
                        )}
                        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t"
                    >
                        <div className="p-4 space-y-4">
                            {/* Preview Banner */}
                            {(sale.background_image || sale.background_color) && (
                                <div
                                    className="h-20 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden"
                                    style={{
                                        background: sale.background_image
                                            ? `url(${sale.background_image}) center/cover`
                                            : sale.background_color
                                    }}
                                >
                                    <span className="bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm text-sm">
                                        {sale.offer_heading || sale.name}
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-400 text-xs uppercase">Badge</span>
                                    <p className="font-medium">{sale.badge_text || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-xs uppercase">Priority</span>
                                    <p className="font-medium">{sale.priority}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-xs uppercase">Timezone</span>
                                    <p className="font-medium">{sale.timezone || 'Asia/Kolkata'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-xs uppercase">CTA</span>
                                    <p className="font-medium">{sale.cta_text || 'Shop Now'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Start: {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>End: {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            {/* Display Settings */}
                            <div className="flex gap-4 text-xs">
                                <span className={`px-2 py-1 rounded-full ${sale.show_countdown !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    Countdown: {sale.show_countdown !== false ? 'ON' : 'OFF'}
                                </span>
                                <span className={`px-2 py-1 rounded-full ${sale.show_products_count !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    Products Count: {sale.show_products_count !== false ? 'ON' : 'OFF'}
                                </span>
                            </div>

                            {sale.description && (
                                <p className="text-sm text-gray-600 italic">"{sale.description}"</p>
                            )}

                            <div className="flex gap-2 pt-2 border-t">
                                <button
                                    onClick={() => onManageProducts(sale)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-xl font-medium hover:bg-pink-100"
                                >
                                    <Package className="w-4 h-4" />
                                    Add Products
                                </button>
                                <button
                                    onClick={() => onEdit(sale)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(sale)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// =============================================================================
// MAIN ADMIN SALES PAGE
// =============================================================================
export default function AdminSales() {
    const { token } = useAuth()
    const { showToast } = useToast()

    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [showSaleModal, setShowSaleModal] = useState(false)
    const [showProductsModal, setShowProductsModal] = useState(false)
    const [selectedSale, setSelectedSale] = useState(null)
    const [expandedSaleId, setExpandedSaleId] = useState(null)

    const fetchSales = useCallback(async () => {
        try {
            setLoading(true)
            const res = await api.getAllSales(token)
            setSales(res.sales || [])
        } catch (err) {
            console.error('Failed to fetch sales:', err)
            showToast('Failed to load sales', 'error')
        } finally {
            setLoading(false)
        }
    }, [token, showToast])

    useEffect(() => {
        fetchSales()
    }, [fetchSales])

    const handleCreateSale = () => {
        setSelectedSale(null)
        setShowSaleModal(true)
    }

    const handleEditSale = (sale) => {
        setSelectedSale(sale)
        setShowSaleModal(true)
    }

    const handleSaveSale = async (formData) => {
        try {
            if (selectedSale) {
                await api.updateSale(selectedSale.id, formData, token)
                showToast('Sale updated successfully!', 'success')
            } else {
                await api.createSale(formData, token)
                showToast('Sale created successfully!', 'success')
            }
            fetchSales()
        } catch (err) {
            showToast(err.message || 'Failed to save sale', 'error')
            throw err
        }
    }

    const handleDeleteSale = async (sale) => {
        if (!window.confirm(`Are you sure you want to delete "${sale.name}"?`)) return

        try {
            await api.deleteSale(sale.id, token)
            showToast('Sale deleted successfully', 'success')
            fetchSales()
        } catch (err) {
            showToast('Failed to delete sale', 'error')
        }
    }

    const handleManageProducts = (sale) => {
        setSelectedSale(sale)
        setShowProductsModal(true)
    }

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Flame className="w-7 h-7 text-orange-500" />
                            Sales Management
                        </h1>
                        <p className="text-gray-500 mt-1">Create and manage sale campaigns</p>
                    </div>
                    <button
                        onClick={handleCreateSale}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        Create Sale
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Sales', value: sales.length, color: 'from-orange-500 to-red-500', icon: Tag },
                        { label: 'Active Sales', value: sales.filter(s => s.is_active).length, color: 'from-green-500 to-emerald-500', icon: Eye },
                        { label: 'Products on Sale', value: sales.reduce((acc, s) => acc + (s.product_count || 0), 0), color: 'from-purple-500 to-pink-500', icon: Package },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sales List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                ) : sales.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border">
                        <Flame className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Sales Yet</h3>
                        <p className="text-gray-500 mb-4">Create your first sale campaign to get started</p>
                        <button
                            onClick={handleCreateSale}
                            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg"
                        >
                            Create Sale
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sales.map(sale => (
                            <SaleCard
                                key={sale.id}
                                sale={sale}
                                onEdit={handleEditSale}
                                onDelete={handleDeleteSale}
                                onManageProducts={handleManageProducts}
                                expanded={expandedSaleId === sale.id}
                                onToggleExpand={(id) => setExpandedSaleId(expandedSaleId === id ? null : id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <SaleFormModal
                isOpen={showSaleModal}
                onClose={() => setShowSaleModal(false)}
                sale={selectedSale}
                onSave={handleSaveSale}
            />

            <AddProductsModal
                isOpen={showProductsModal}
                onClose={() => setShowProductsModal(false)}
                sale={selectedSale}
                onProductsAdded={fetchSales}
            />
        </AdminLayout>
    )
}
