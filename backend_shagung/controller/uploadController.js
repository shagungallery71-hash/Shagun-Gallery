import multer from 'multer';
import cloudinary from '../config/cloudnary.js';
import fs from 'fs';

// Configure memory storage (file will be in buffer, not saved to disk)
// If you want to use disk storage, change to multer.diskStorage & update upload logic
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        let result;

        // Support both memory storage (buffer) and disk storage (path)
        if (req.file.buffer) {
            // Memory Storage
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;

            result = await cloudinary.uploader.upload(dataURI, {
                folder: 'products',
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            });
        } else if (req.file.path) {
            // Disk Storage
            result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'products',
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            });

            // Delete local file
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Failed to delete local file:", err);
                else console.log("Deleted local file:", req.file.path);
            });
        } else {
            throw new Error("No file buffer or path found");
        }

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);

        // Try to delete file if it exists and error occurred
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Failed to delete local file after error:", err);
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};
