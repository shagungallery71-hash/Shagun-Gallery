import express from "express";
import multer from "multer";
import {
    // Public endpoints
    getActiveJobs,
    getJobDetails,
    getDepartments,
    submitApplication,
    uploadResume,
    downloadResume,
    // Admin endpoints - Jobs
    getAllJobsAdmin,
    createJob,
    updateJob,
    deleteJob,
    toggleJobStatus,
    // Admin endpoints - Applications
    getAllApplications,
    getApplicationDetails,
    updateApplicationStatus,
    deleteApplication,
    getCareersStats,
} from "../controller/careersController.js";
import { PermissionAdmin } from "../middleware/auth.js";

const careersRouter = express.Router();

// Multer configuration for resume uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max for resumes
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and Word documents are allowed'), false);
        }
    }
});

// =============================================================================
// PUBLIC ENDPOINTS (No caching - direct DB access)
// =============================================================================

// Get all active jobs
careersRouter.get("/jobs", getActiveJobs);

// Get unique departments for filters
careersRouter.get("/departments", getDepartments);

// Get single job details
careersRouter.get("/jobs/:id", getJobDetails);

// Submit job application
careersRouter.post("/apply", submitApplication);

// Upload resume
careersRouter.post("/upload-resume", upload.single('resume'), uploadResume);

// Proxy download for resumes (to handle CORS/Auth)
careersRouter.get("/download-resume", downloadResume);

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

// Get career statistics
careersRouter.get("/admin/stats", PermissionAdmin, getCareersStats);

// Jobs CRUD
careersRouter.get("/admin/jobs", PermissionAdmin, getAllJobsAdmin);
careersRouter.post("/admin/jobs", PermissionAdmin, createJob);
careersRouter.put("/admin/jobs/:id", PermissionAdmin, updateJob);
careersRouter.delete("/admin/jobs/:id", PermissionAdmin, deleteJob);
careersRouter.patch("/admin/jobs/:id/toggle", PermissionAdmin, toggleJobStatus);

// Applications management
careersRouter.get("/admin/applications", PermissionAdmin, getAllApplications);
careersRouter.get("/admin/applications/:id", PermissionAdmin, getApplicationDetails);
careersRouter.patch("/admin/applications/:id/status", PermissionAdmin, updateApplicationStatus);
careersRouter.delete("/admin/applications/:id", PermissionAdmin, deleteApplication);

export default careersRouter;
