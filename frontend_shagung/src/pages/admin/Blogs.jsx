import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, Edit2, Trash2, Eye, EyeOff, Star,
    Image, Video, Upload, X, Loader2, ChevronDown, Calendar,
    Save, BookOpen, Tag, Palette, FileText, Globe, Settings,
    Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon,
    Quote, Code, Heading1, Heading2, Heading3, AlignLeft, AlignCenter,
    AlignRight, Undo, Redo, Image as ImageIcon
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

// =============================================================================
// ADMIN BLOGS PAGE - Full Blog Management with Rich Text Editor
// =============================================================================

// Simple Rich Text Editor Component
const RichTextEditor = ({ value, onChange, placeholder = 'Start writing your blog post...' }) => {
    const editorRef = useRef(null);
    const [isSourceMode, setIsSourceMode] = useState(false);

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleContentChange();
    };

    const handleContentChange = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const insertImage = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            execCommand('insertImage', url);
        }
    };

    const formatBlock = (tag) => {
        execCommand('formatBlock', tag);
    };

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const ToolButton = ({ onClick, icon: Icon, title, active = false }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${active ? 'bg-gray-200 text-primary' : 'text-gray-600'
                }`}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div className="border rounded-xl overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b">
                <ToolButton onClick={() => execCommand('undo')} icon={Undo} title="Undo" />
                <ToolButton onClick={() => execCommand('redo')} icon={Redo} title="Redo" />
                <div className="w-px h-6 bg-gray-300 mx-1" />

                <select
                    onChange={(e) => formatBlock(e.target.value)}
                    className="px-2 py-1 bg-white border rounded text-sm"
                    defaultValue=""
                >
                    <option value="">Normal</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="blockquote">Quote</option>
                    <option value="pre">Code Block</option>
                </select>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolButton onClick={() => execCommand('bold')} icon={Bold} title="Bold (Ctrl+B)" />
                <ToolButton onClick={() => execCommand('italic')} icon={Italic} title="Italic (Ctrl+I)" />
                <ToolButton onClick={() => execCommand('underline')} icon={Underline} title="Underline (Ctrl+U)" />

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
                <ToolButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Numbered List" />

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Align Left" />
                <ToolButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Align Center" />
                <ToolButton onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Align Right" />

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolButton onClick={insertLink} icon={LinkIcon} title="Insert Link" />
                <ToolButton onClick={insertImage} icon={ImageIcon} title="Insert Image" />

                <div className="flex-1" />

                <button
                    type="button"
                    onClick={() => setIsSourceMode(!isSourceMode)}
                    className={`px-3 py-1 text-xs rounded ${isSourceMode ? 'bg-primary text-white' : 'bg-gray-200'
                        }`}
                >
                    {isSourceMode ? 'Visual' : 'HTML'}
                </button>
            </div>

            {/* Editor */}
            {isSourceMode ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full min-h-[400px] p-4 font-mono text-sm resize-y focus:outline-none"
                    placeholder={placeholder}
                />
            ) : (
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    className="min-h-[400px] p-4 focus:outline-none prose max-w-none
                        prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                        prose-p:my-3 prose-a:text-primary prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                        prose-img:rounded-lg prose-img:max-w-full"
                    data-placeholder={placeholder}
                    suppressContentEditableWarning
                />
            )}
        </div>
    );
};

// Blog Form Modal
const BlogFormModal = ({ isOpen, onClose, blog = null, categories = [], onSave }) => {
    const { token } = useAuth();
    const [loading, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('content');
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category_id: '',
        is_published: false,
        is_featured: false,
        background_color: '#1e1e2e',
        gradient: '',
        meta_title: '',
        meta_description: '',
        tags: []
    });
    const [featuredImage, setFeaturedImage] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [previewFeatured, setPreviewFeatured] = useState('');
    const [previewBackground, setPreviewBackground] = useState('');
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (blog) {
            setFormData({
                title: blog.title || '',
                content: blog.content || '',
                excerpt: blog.excerpt || '',
                category_id: blog.category_id || '',
                is_published: blog.is_published || false,
                is_featured: blog.is_featured || false,
                background_color: blog.background_color || '#1e1e2e',
                gradient: blog.gradient || '',
                meta_title: blog.meta_title || '',
                meta_description: blog.meta_description || '',
                tags: []
            });
            setPreviewFeatured(blog.featured_image || '');
            setPreviewBackground(blog.background_image || '');
        } else {
            setFormData({
                title: '',
                content: '',
                excerpt: '',
                category_id: '',
                is_published: false,
                is_featured: false,
                background_color: '#1e1e2e',
                gradient: '',
                meta_title: '',
                meta_description: '',
                tags: []
            });
            setPreviewFeatured('');
            setPreviewBackground('');
        }
        setFeaturedImage(null);
        setVideoFile(null);
        setBackgroundImage(null);
    }, [blog, isOpen]);

    const handleImageChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'featured') {
            setFeaturedImage(file);
            setPreviewFeatured(URL.createObjectURL(file));
        } else if (type === 'background') {
            setBackgroundImage(file);
            setPreviewBackground(URL.createObjectURL(file));
        } else if (type === 'video') {
            setVideoFile(file);
        }
    };

    const handleAddTag = () => {
        const tag = tagInput.trim();
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tagToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'tags') {
                    submitData.append(key, JSON.stringify(formData[key]));
                } else {
                    submitData.append(key, formData[key]);
                }
            });

            if (featuredImage) submitData.append('featured_image', featuredImage);
            if (videoFile) submitData.append('video', videoFile);
            if (backgroundImage) submitData.append('background_image', backgroundImage);

            let response;
            if (blog) {
                response = await api.updateBlog(blog.id, submitData, token);
            } else {
                response = await api.createBlog(submitData, token);
            }

            if (response.success) {
                onSave(response.blog);
                onClose();
            } else {
                alert(response.message || 'Failed to save blog');
            }
        } catch (error) {
            console.error('Error saving blog:', error);
            alert('Failed to save blog');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'content', label: 'Content', icon: FileText },
        { id: 'media', label: 'Media', icon: Image },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'seo', label: 'SEO', icon: Globe },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const gradientPresets = [
        'rgba(0,0,0,0.8), rgba(0,0,0,0.4)',
        'rgba(244,63,94,0.8), rgba(168,85,247,0.6)',
        'rgba(59,130,246,0.8), rgba(16,185,129,0.6)',
        'rgba(245,158,11,0.8), rgba(239,68,68,0.6)',
        'rgba(168,85,247,0.8), rgba(236,72,153,0.6)',
        'rgba(16,185,129,0.8), rgba(6,182,212,0.6)',
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary to-purple-600">
                    <h2 className="text-2xl font-bold text-white">
                        {blog ? 'Edit Blog Post' : 'Create New Blog Post'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    {/* Content Tab */}
                    {activeTab === 'content' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                    placeholder="Enter blog title..."
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Excerpt (Short Description)
                                </label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                    placeholder="Brief summary of the blog post..."
                                    rows={3}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Content *
                                </label>
                                <RichTextEditor
                                    value={formData.content}
                                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                >
                                    <option value="">Select category...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                        >
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="hover:text-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                        placeholder="Add a tag..."
                                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Featured Image
                                </label>
                                <div className="border-2 border-dashed rounded-xl p-6 text-center">
                                    {previewFeatured ? (
                                        <div className="relative inline-block">
                                            <img
                                                src={previewFeatured}
                                                alt="Preview"
                                                className="max-h-64 rounded-lg mx-auto"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFeaturedImage(null);
                                                    setPreviewFeatured('');
                                                    setFormData(prev => ({ ...prev, remove_featured_image: true }));
                                                }}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                                <Upload className="w-10 h-10" />
                                                <span>Click to upload featured image</span>
                                                <span className="text-xs">PNG, JPG up to 10MB</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageChange(e, 'featured')}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Video (Optional)
                                </label>
                                <div className="border-2 border-dashed rounded-xl p-6 text-center">
                                    {videoFile ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <Video className="w-8 h-8 text-primary" />
                                            <span>{videoFile.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setVideoFile(null)}
                                                className="p-1 bg-red-500 text-white rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                                <Video className="w-10 h-10" />
                                                <span>Click to upload video</span>
                                                <span className="text-xs">MP4, WebM up to 50MB</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={(e) => handleImageChange(e, 'video')}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Background Image
                                </label>
                                <div className="border-2 border-dashed rounded-xl p-6 text-center">
                                    {previewBackground ? (
                                        <div className="relative inline-block">
                                            <img
                                                src={previewBackground}
                                                alt="Background Preview"
                                                className="max-h-48 rounded-lg mx-auto"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBackgroundImage(null);
                                                    setPreviewBackground('');
                                                    setFormData(prev => ({ ...prev, remove_background_image: true }));
                                                }}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                                <Image className="w-10 h-10" />
                                                <span>Hero background image</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageChange(e, 'background')}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Background Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={formData.background_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                                        className="w-12 h-12 rounded-lg cursor-pointer border-0"
                                    />
                                    <input
                                        type="text"
                                        value={formData.background_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                                        className="flex-1 px-4 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Gradient Overlay
                                </label>
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    {gradientPresets.map((gradient, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, gradient }))}
                                            className={`h-16 rounded-lg border-2 transition-all ${formData.gradient === gradient
                                                ? 'border-primary ring-2 ring-primary/30'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            style={{ background: `linear-gradient(135deg, ${gradient})` }}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={formData.gradient}
                                    onChange={(e) => setFormData(prev => ({ ...prev, gradient: e.target.value }))}
                                    placeholder="Custom gradient (e.g., rgba(0,0,0,0.8), rgba(0,0,0,0.4))"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Preview
                                </label>
                                <div
                                    className="h-48 rounded-xl overflow-hidden relative flex items-center justify-center"
                                    style={{
                                        background: formData.gradient
                                            ? `linear-gradient(135deg, ${formData.gradient})`
                                            : formData.background_color
                                    }}
                                >
                                    {previewBackground && (
                                        <img
                                            src={previewBackground}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover opacity-30"
                                        />
                                    )}
                                    <span className="relative text-white text-2xl font-bold">
                                        {formData.title || 'Blog Title Preview'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SEO Tab */}
                    {activeTab === 'seo' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Meta Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.meta_title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                                    placeholder="SEO title (defaults to blog title)"
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    {(formData.meta_title || formData.title).length}/60 characters
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Meta Description
                                </label>
                                <textarea
                                    value={formData.meta_description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                                    placeholder="SEO description (defaults to excerpt)"
                                    rows={3}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    {(formData.meta_description || formData.excerpt).length}/160 characters
                                </p>
                            </div>

                            {/* SEO Preview */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 mb-2">Search Engine Preview</p>
                                <div className="bg-white p-4 rounded-lg border">
                                    <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                                        {formData.meta_title || formData.title || 'Blog Post Title'}
                                    </p>
                                    <p className="text-green-700 text-sm">
                                        shagungallery.com/blog/{formData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'post-slug'}
                                    </p>
                                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                        {formData.meta_description || formData.excerpt || 'Blog post description will appear here...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-900">Publish Status</p>
                                    <p className="text-sm text-gray-500">
                                        {formData.is_published ? 'This post is visible to everyone' : 'This post is a draft'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, is_published: !prev.is_published }))}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${formData.is_published ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${formData.is_published ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-900">Featured Post</p>
                                    <p className="text-sm text-gray-500">
                                        Featured posts appear prominently on the blog page
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${formData.is_featured ? 'bg-amber-500' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${formData.is_featured ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, is_published: false }))}
                            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
                        >
                            Save as Draft
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !formData.title || !formData.content}
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {blog ? 'Update Post' : 'Publish Post'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Category Form Modal
const CategoryFormModal = ({ isOpen, onClose, category = null, onSave }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#f43f5e',
        icon: '📝',
        position: 0
    });

    const iconOptions = ['📝', '👗', '💄', '💒', '🪔', '🎬', '📢', '✨', '🎨', '💡', '🌟', '❤️', '🛍️', '👑'];
    const colorOptions = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || '',
                color: category.color || '#f43f5e',
                icon: category.icon || '📝',
                position: category.position || 0
            });
        } else {
            setFormData({
                name: '',
                description: '',
                color: '#f43f5e',
                icon: '📝',
                position: 0
            });
        }
    }, [category, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let response;
            if (category) {
                response = await api.updateBlogCategory(category.id, formData, token);
            } else {
                response = await api.createBlogCategory(formData, token);
            }

            if (response.success) {
                onSave(response.category);
                onClose();
            } else {
                alert(response.message || 'Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    {category ? 'Edit Category' : 'New Category'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                        <div className="flex flex-wrap gap-2">
                            {iconOptions.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${formData.icon === icon
                                        ? 'border-primary bg-primary/10'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                    className={`w-10 h-10 rounded-lg border-2 transition-all ${formData.color === color
                                        ? 'border-gray-900 ring-2 ring-offset-2'
                                        : 'border-transparent'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Main Admin Blogs Component
export default function AdminBlogs() {
    const { token } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [showBlogModal, setShowBlogModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showCategories, setShowCategories] = useState(false);

    // Fetch blogs
    const fetchBlogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (searchQuery) params.search = searchQuery;
            if (statusFilter) params.status = statusFilter;

            const response = await api.adminBlogs(params, token);
            if (response.success) {
                setBlogs(response.blogs);
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch blogs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, statusFilter, token]);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.blogCategories();
            if (response.success) {
                setCategories(response.categories);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, []);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleEditBlog = (blog) => {
        setEditingBlog(blog);
        setShowBlogModal(true);
    };

    const handleDeleteBlog = async (id) => {
        if (!confirm('Are you sure you want to delete this blog post?')) return;

        try {
            const response = await api.deleteBlog(id, token);
            if (response.success) {
                fetchBlogs();
            } else {
                alert(response.message || 'Failed to delete blog');
            }
        } catch (error) {
            console.error('Error deleting blog:', error);
            alert('Failed to delete blog');
        }
    };

    const handleTogglePublish = async (blog) => {
        try {
            const response = await api.toggleBlogPublish(blog.id, token);
            if (response.success) {
                setBlogs(prev => prev.map(b =>
                    b.id === blog.id ? { ...b, is_published: !b.is_published } : b
                ));
            }
        } catch (error) {
            console.error('Error toggling publish:', error);
        }
    };

    const handleToggleFeatured = async (blog) => {
        try {
            const response = await api.toggleBlogFeatured(blog.id, token);
            if (response.success) {
                setBlogs(prev => prev.map(b =>
                    b.id === blog.id ? { ...b, is_featured: !b.is_featured } : b
                ));
            }
        } catch (error) {
            console.error('Error toggling featured:', error);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await api.deleteBlogCategory(id, token);
            if (response.success) {
                fetchCategories();
            } else {
                alert(response.message || 'Failed to delete category');
            }
        } catch (error) {
            alert('Failed to delete category');
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
                        <p className="text-gray-600 mt-1">Create, edit, and manage blog posts</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCategories(!showCategories)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <Tag className="w-5 h-5" />
                            Categories
                        </button>
                        <button
                            onClick={() => {
                                setEditingBlog(null);
                                setShowBlogModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            New Post
                        </button>
                    </div>
                </div>

                {/* Categories Panel */}
                <AnimatePresence>
                    {showCategories && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="bg-white rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Categories</h2>
                                    <button
                                        onClick={() => {
                                            setEditingCategory(null);
                                            setShowCategoryModal(true);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {categories.map(cat => (
                                        <div
                                            key={cat.id}
                                            className="relative group p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-colors"
                                        >
                                            <div className="text-center">
                                                <div
                                                    className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-2xl"
                                                    style={{ backgroundColor: `${cat.color}20` }}
                                                >
                                                    {cat.icon}
                                                </div>
                                                <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                                                <p className="text-xs text-gray-500">{cat.blog_count || 0} posts</p>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingCategory(cat);
                                                        setShowCategoryModal(true);
                                                    }}
                                                    className="p-1 bg-gray-100 rounded text-gray-600 hover:text-primary"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    className="p-1 bg-gray-100 rounded text-gray-600 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search blog posts..."
                            className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/30 focus:outline-none"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Drafts</option>
                    </select>
                </div>

                {/* Blog Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Blog Post</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Category</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Views</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Date</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={6} className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="skeleton w-16 h-16 rounded-lg" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="skeleton-title" />
                                                        <div className="skeleton-text w-1/2" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : blogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12">
                                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">No blog posts found</p>
                                            <button
                                                onClick={() => setShowBlogModal(true)}
                                                className="mt-4 text-primary font-medium hover:underline"
                                            >
                                                Create your first post
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    blogs.map(blog => (
                                        <tr key={blog.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                        <img
                                                            src={blog.featured_image || 'https://via.placeholder.com/100'}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 line-clamp-1">{blog.title}</h3>
                                                        <p className="text-sm text-gray-500 line-clamp-1">{blog.excerpt}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {blog.category_name ? (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                                        {blog.category_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Uncategorized</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleTogglePublish(blog)}
                                                        className={`p-2 rounded-lg transition-colors ${blog.is_published
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-gray-100 text-gray-400'
                                                            }`}
                                                        title={blog.is_published ? 'Published' : 'Draft'}
                                                    >
                                                        {blog.is_published ? (
                                                            <Eye className="w-4 h-4" />
                                                        ) : (
                                                            <EyeOff className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleFeatured(blog)}
                                                        className={`p-2 rounded-lg transition-colors ${blog.is_featured
                                                            ? 'bg-amber-100 text-amber-600'
                                                            : 'bg-gray-100 text-gray-400'
                                                            }`}
                                                        title={blog.is_featured ? 'Featured' : 'Not Featured'}
                                                    >
                                                        <Star className={`w-4 h-4 ${blog.is_featured ? 'fill-current' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-600">
                                                {blog.views?.toLocaleString() || 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(blog.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <a
                                                        href={`/blog/${blog.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Preview"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                    <button
                                                        onClick={() => handleEditBlog(blog)}
                                                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBlog(blog.id)}
                                                        className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t">
                            <p className="text-sm text-gray-600">
                                Showing {((page - 1) * 15) + 1} - {Math.min(page * 15, pagination.total)} of {pagination.total}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!pagination.hasMore}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showBlogModal && (
                    <BlogFormModal
                        isOpen={showBlogModal}
                        onClose={() => {
                            setShowBlogModal(false);
                            setEditingBlog(null);
                        }}
                        blog={editingBlog}
                        categories={categories}
                        onSave={() => fetchBlogs()}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCategoryModal && (
                    <CategoryFormModal
                        isOpen={showCategoryModal}
                        onClose={() => {
                            setShowCategoryModal(false);
                            setEditingCategory(null);
                        }}
                        category={editingCategory}
                        onSave={() => fetchCategories()}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
