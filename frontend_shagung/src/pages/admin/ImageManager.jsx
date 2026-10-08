// =============================================================================
// IMAGE MANAGER COMPONENT
// Manages product images with upload, delete, primary selection, and reordering
// Supports optional color linking for images (for product page color-image sync)
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Star, X, RefreshCw, Image as ImageIcon, Plus, Loader2, ChevronLeft, ChevronRight, Save, Palette } from 'lucide-react';
import { adminApi } from './index';
import { Button } from '../../components/ui';
import { useToast } from '../../components/ToastContext';

// Image Card Component with reorder buttons and optional color indicator
const ImageCard = ({
    image,
    isPrimary,
    onDelete,
    onSetPrimary,
    onMoveLeft,
    onMoveRight,
    canMoveLeft,
    canMoveRight,
    deleting,
    settingPrimary,
    index
}) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${isPrimary ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
            }`}
    >
        <img
            src={typeof image === 'string' ? image : image.image_url}
            alt="Product"
            className="w-full h-full object-cover"
        />

        {/* Position Badge */}
        <div className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white text-[10px] font-bold rounded flex items-center justify-center">
            {index + 1}
        </div>

        {/* Thumbnail Badge for first/primary image */}
        {isPrimary && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-white text-[9px] font-medium rounded flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                Thumbnail
            </div>
        )}

        {/* Color indicator badge (only if image has a color) */}
        {image.color && (
            <div className="absolute bottom-1 left-1 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-white">
                <div
                    className="w-3 h-3 rounded-full border border-white/50"
                    style={{ backgroundColor: image.color_code || '#ccc' }}
                />
                <span className="truncate max-w-[60px]">{image.color}</span>
            </div>
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            {/* Move Buttons Row */}
            <div className="flex gap-2">
                {canMoveLeft && (
                    <button
                        onClick={() => onMoveLeft(index)}
                        className="p-2 bg-white/90 rounded-full hover:bg-white text-gray-700"
                        title="Move left"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
                {canMoveRight && (
                    <button
                        onClick={() => onMoveRight(index)}
                        className="p-2 bg-white/90 rounded-full hover:bg-white text-gray-700"
                        title="Move right"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Primary and Delete Buttons Row */}
            <div className="flex gap-2">
                {onSetPrimary && (
                    <button
                        onClick={() => onSetPrimary(image.id)}
                        disabled={settingPrimary === image.id || isPrimary}
                        className={`p-2 rounded-full text-gray-700 disabled:opacity-50 ${isPrimary
                            ? 'bg-primary text-white cursor-default'
                            : 'bg-white/90 hover:bg-white'
                            }`}
                        title={isPrimary ? "Current thumbnail" : "Set as thumbnail"}
                    >
                        {settingPrimary === image.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Star className={`w-4 h-4 ${isPrimary ? 'fill-current' : ''}`} />
                        )}
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(image.id)}
                        disabled={deleting === image.id}
                        className="p-2 bg-red-500/90 rounded-full hover:bg-red-500 text-white disabled:opacity-50"
                        title="Delete"
                    >
                        {deleting === image.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>
        </div>
    </motion.div>
);

// New Image Preview Card (for files not yet uploaded)
const NewImageCard = ({ file, color, colorCode, onRemove }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-blue-400"
    >
        <img
            src={URL.createObjectURL(file)}
            alt="New upload"
            className="w-full h-full object-cover"
        />
        <div className="absolute top-1 left-1 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-medium rounded">
            New
        </div>
        {/* Color indicator for pending upload (only if color selected) */}
        {color && (
            <div className="absolute bottom-1 left-1 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-white">
                <div
                    className="w-3 h-3 rounded-full border border-white/50"
                    style={{ backgroundColor: colorCode || '#ccc' }}
                />
                <span className="truncate max-w-[60px]">{color}</span>
            </div>
        )}
        <button
            onClick={onRemove}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <X className="w-3 h-3" />
        </button>
    </motion.div>
);

// Optional Color Selector for Image Upload (collapsed by default)
const ColorSelector = ({ selectedColor, selectedColorCode, onColorChange, onColorCodeChange, variants = [], isExpanded, onToggle }) => {
    // Get unique colors from variants
    const uniqueColors = variants.reduce((acc, v) => {
        if (v.color && !acc.find(c => c.name === v.color)) {
            acc.push({ name: v.color, code: v.color_code || '#000000' });
        }
        return acc;
    }, []);

    return (
        <div className="mb-4">
            {/* Toggle button */}
            <button
                type="button"
                onClick={onToggle}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isExpanded
                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
            >
                <Palette className="w-4 h-4" />
                {selectedColor ? `Color: ${selectedColor}` : 'Link to Color (Optional)'}
                <span className="text-xs">
                    {isExpanded ? '▲' : '▼'}
                </span>
            </button>

            {/* Expanded color options */}
            {isExpanded && (
                <div className="mt-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
                    <p className="text-xs text-gray-500 mb-3">
                        💡 Select a color to link images to that variant. This enables color-image sync on the product page.
                    </p>

                    {/* Show existing variant colors as quick options */}
                    {uniqueColors.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs text-gray-600 font-medium mb-2">Quick select from variants:</p>
                            <div className="flex flex-wrap gap-2">
                                {uniqueColors.map((color) => (
                                    <button
                                        key={color.name}
                                        type="button"
                                        onClick={() => {
                                            onColorChange(color.name);
                                            onColorCodeChange(color.code);
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedColor === color.name
                                            ? 'bg-pink-500 text-white shadow-md'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-400'
                                            }`}
                                    >
                                        <div
                                            className="w-4 h-4 rounded-full border border-gray-300"
                                            style={{ backgroundColor: color.code }}
                                        />
                                        {color.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Manual color input */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Color Name
                            </label>
                            <input
                                type="text"
                                value={selectedColor}
                                onChange={(e) => onColorChange(e.target.value)}
                                placeholder="e.g. Royal Maroon"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Color Code
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={selectedColorCode}
                                    onChange={(e) => onColorCodeChange(e.target.value)}
                                    className="w-10 h-9 border border-gray-200 rounded cursor-pointer p-0.5"
                                />
                                <input
                                    type="text"
                                    value={selectedColorCode}
                                    onChange={(e) => onColorCodeChange(e.target.value)}
                                    placeholder="#000000"
                                    maxLength={7}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clear button */}
                    {selectedColor && (
                        <button
                            type="button"
                            onClick={() => {
                                onColorChange('');
                                onColorCodeChange('#000000');
                            }}
                            className="mt-3 text-xs text-gray-500 hover:text-red-500 underline"
                        >
                            Clear color selection
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Main Image Manager Component
export default function ImageManager({ productId, images = [], variants = [], onUpdate }) {
    const { showToast } = useToast();
    const [newFiles, setNewFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [settingPrimary, setSettingPrimary] = useState(null);
    const [savingOrder, setSavingOrder] = useState(false);
    const [orderChanged, setOrderChanged] = useState(false);
    const [localImages, setLocalImages] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // Color selection state for upload (optional)
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedColorCode, setSelectedColorCode] = useState('#000000');
    const [showColorSelector, setShowColorSelector] = useState(false);

    // Sync local images when props change (after parent refetches data)
    useEffect(() => {
        if (!orderChanged) {
            setLocalImages(null);
        }
    }, [images]);

    // Convert images to array and sort by position
    const getImageList = () => {
        const source = localImages || images;
        if (!Array.isArray(source)) return [];

        const list = source.map((img, idx) =>
            typeof img === 'string'
                ? { id: idx, image_url: img, is_primary: idx === 0, position: idx, color: null, color_code: null }
                : { ...img, position: img.position ?? idx }
        );

        // Sort by position (keep original order logic)
        list.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

        return list;
    };

    const imageList = getImageList();

    // Handle file selection
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file types
        const validFiles = files.filter(f => f.type.startsWith('image/'));
        if (validFiles.length !== files.length) {
            setError('Only image files are allowed');
        }

        setNewFiles(prev => [...prev, ...validFiles]);
        setError('');

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Remove new file before upload
    const removeNewFile = (index) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Upload new images
    const handleUpload = async () => {
        if (!productId || newFiles.length === 0) return;

        setUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('product_id', productId);

            // Add color info only if selected (optional)
            if (selectedColor.trim()) {
                formData.append('color', selectedColor.trim());
                formData.append('color_code', selectedColorCode);
            }

            newFiles.forEach(file => {
                formData.append('images', file);
            });

            await adminApi.uploadImages(formData);
            setNewFiles([]);
            setLocalImages(null);
            setOrderChanged(false);

            const message = selectedColor.trim()
                ? `Images uploaded (linked to: ${selectedColor})`
                : 'Images uploaded successfully';
            showToast?.(message, 'success');

            // Reset color selection after upload
            setSelectedColor('');
            setSelectedColorCode('#000000');
            setShowColorSelector(false);

            // Small delay to ensure DB propagation before refresh
            setTimeout(() => {
                onUpdate();
            }, 500);
        } catch (err) {
            console.error("Upload failed:", err);
            setError(err.message || "Failed to upload images");
            showToast?.('Failed to upload images', 'error');
        } finally {
            setUploading(false);
        }
    };

    // Delete existing image
    const handleDelete = async (imageId) => {
        if (!confirm('Delete this image?')) return;

        setDeleting(imageId);
        try {
            await adminApi.deleteImage(imageId);
            showToast?.('Image deleted', 'success');
            setLocalImages(null);
            setOrderChanged(false);

            // Small delay to ensure backend cache is invalidated before refetching
            setTimeout(() => {
                onUpdate();
            }, 500);
        } catch (err) {
            setError(err.message);
            showToast?.('Failed to delete image', 'error');
        } finally {
            setDeleting(null);
        }
    };

    // Set image as primary/thumbnail
    const handleSetPrimary = async (imageId) => {
        setSettingPrimary(imageId);
        setError('');
        try {
            await adminApi.setPrimaryImage(imageId);
            showToast?.('Thumbnail updated successfully', 'success');
            setLocalImages(null);
            setOrderChanged(false);
            onUpdate();
        } catch (err) {
            console.error('Set primary failed:', err);
            setError(err.message || 'Failed to set primary image');
            showToast?.('Failed to set thumbnail', 'error');
        } finally {
            setSettingPrimary(null);
        }
    };

    // Move image left
    const handleMoveLeft = (index) => {
        if (index === 0) return;
        const newList = [...imageList];
        const temp = newList[index];
        newList[index] = newList[index - 1];
        newList[index - 1] = temp;
        // Update positions
        newList.forEach((img, idx) => {
            img.position = idx;
        });
        setLocalImages(newList);
        setOrderChanged(true);
    };

    // Move image right
    const handleMoveRight = (index) => {
        if (index >= imageList.length - 1) return;
        const newList = [...imageList];
        const temp = newList[index];
        newList[index] = newList[index + 1];
        newList[index + 1] = temp;
        // Update positions
        newList.forEach((img, idx) => {
            img.position = idx;
        });
        setLocalImages(newList);
        setOrderChanged(true);
    };

    // Save image order
    const handleSaveOrder = async () => {
        if (!productId || !orderChanged) return;

        setSavingOrder(true);
        setError('');
        try {
            // Prepare the updated image list with new positions and is_primary
            const updatedImageList = imageList.map((img, index) => ({
                ...img,
                position: index,
                is_primary: index === 0 // First image becomes the primary/thumbnail
            }));

            const imagesToSave = updatedImageList.map((img) => ({
                id: img.id,
                position: img.position,
                is_primary: img.is_primary
            }));

            await adminApi.updateImagePositions(productId, imagesToSave);
            showToast?.('Image order saved successfully', 'success');

            // Keep the updated order visible in UI
            setLocalImages(updatedImageList);
            setOrderChanged(false);

            // Also trigger parent update for data sync
            onUpdate();
        } catch (err) {
            console.error('Save order failed:', err);
            setError(err.message || 'Failed to save image order');
            showToast?.('Failed to save image order', 'error');
        } finally {
            setSavingOrder(false);
        }
    };

    // Reset order changes
    const handleResetOrder = () => {
        setLocalImages(null);
        setOrderChanged(false);
    };

    return (
        <div className="border border-gray-200 rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                    <h3 className="font-medium">Images ({imageList.length})</h3>
                    {orderChanged && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                            Unsaved changes
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Reset Button */}
                    {orderChanged && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleResetOrder}
                        >
                            Reset
                        </Button>
                    )}

                    {/* Save Order Button */}
                    {orderChanged && productId && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSaveOrder}
                            loading={savingOrder}
                            leftIcon={<Save className="w-4 h-4" />}
                        >
                            Save Order
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Select Images
                    </Button>
                    {newFiles.length > 0 && productId && (
                        <Button
                            size="sm"
                            onClick={handleUpload}
                            loading={uploading}
                            leftIcon={<Upload className="w-4 h-4" />}
                        >
                            Upload ({newFiles.length})
                        </Button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="p-4">
                {/* Color Selector - Show when there are new files to upload */}
                {newFiles.length > 0 && productId && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Palette className="w-4 h-4 text-pink-600" />
                            <h4 className="text-sm font-semibold text-gray-800">Add Color to Images (Optional)</h4>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                            💡 Link these images to a specific color. On the product page, when a customer selects this color, these images will show first.
                        </p>

                        {/* Quick select from variants if available */}
                        {variants.length > 0 && (
                            <div className="mb-3">
                                <p className="text-xs text-gray-600 font-medium mb-2">Quick select from variants:</p>
                                <div className="flex flex-wrap gap-2">
                                    {variants.reduce((acc, v) => {
                                        if (v.color && !acc.find(c => c.name === v.color)) {
                                            acc.push({ name: v.color, code: v.color_code || '#000000' });
                                        }
                                        return acc;
                                    }, []).map((color) => (
                                        <button
                                            key={color.name}
                                            type="button"
                                            onClick={() => {
                                                setSelectedColor(color.name);
                                                setSelectedColorCode(color.code);
                                            }}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedColor === color.name
                                                    ? 'bg-pink-500 text-white shadow-md'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-400'
                                                }`}
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full border border-gray-300"
                                                style={{ backgroundColor: color.code }}
                                            />
                                            {color.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Manual color input - always visible */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Color Name <span className="text-gray-400">(e.g. Royal Maroon)</span>
                                </label>
                                <input
                                    type="text"
                                    value={selectedColor}
                                    onChange={(e) => setSelectedColor(e.target.value)}
                                    placeholder="Enter color name"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Color Code <span className="text-gray-400">(hex code)</span>
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={selectedColorCode}
                                        onChange={(e) => setSelectedColorCode(e.target.value)}
                                        className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={selectedColorCode}
                                        onChange={(e) => setSelectedColorCode(e.target.value)}
                                        placeholder="#000000"
                                        maxLength={7}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Clear button */}
                        {selectedColor && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedColor('');
                                    setSelectedColorCode('#000000');
                                }}
                                className="mt-3 text-xs text-gray-500 hover:text-red-500 underline"
                            >
                                Clear color selection (upload without color)
                            </button>
                        )}
                    </div>
                )}

                {/* Image Grid - All images in one flat grid (original logic preserved) */}
                {(imageList.length > 0 || newFiles.length > 0) ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        <AnimatePresence>
                            {/* Existing Images */}
                            {imageList.map((img, index) => (
                                <ImageCard
                                    key={img.id || index}
                                    image={img}
                                    index={index}
                                    isPrimary={img.is_primary === true}
                                    onDelete={productId ? handleDelete : null}
                                    onSetPrimary={productId ? handleSetPrimary : null}
                                    onMoveLeft={handleMoveLeft}
                                    onMoveRight={handleMoveRight}
                                    canMoveLeft={index > 0}
                                    canMoveRight={index < imageList.length - 1}
                                    deleting={deleting}
                                    settingPrimary={settingPrimary}
                                />
                            ))}

                            {/* New Files (pending upload) */}
                            {newFiles.map((file, index) => (
                                <NewImageCard
                                    key={`new-${index}`}
                                    file={file}
                                    color={selectedColor}
                                    colorCode={selectedColorCode}
                                    onRemove={() => removeNewFile(index)}
                                />
                            ))}
                        </AnimatePresence>

                        {/* Upload Placeholder */}
                        <label
                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Add More</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-500">
                        <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">No images added yet</p>
                        <p className="text-xs text-gray-400 mt-1">Click "Select Images" to add product photos</p>
                        {!productId && <p className="text-xs text-amber-600 mt-2">Save product first to upload images</p>}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="px-4 pb-3 text-xs text-gray-500 space-y-1">
                <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> Click the star icon on any image to set it as the thumbnail (shown in product listings)
                </span>
                <span className="flex items-center gap-1">
                    <ChevronLeft className="w-3 h-3" /><ChevronRight className="w-3 h-3" /> Use arrow buttons to reorder images. First image becomes the thumbnail. Click "Save Order" to apply changes.
                </span>
                {variants.length > 0 && (
                    <span className="flex items-center gap-1 text-pink-600">
                        <Palette className="w-3 h-3" /> Tip: Link images to colors for automatic image switching when customers select colors
                    </span>
                )}
            </div>
        </div>
    );
}
