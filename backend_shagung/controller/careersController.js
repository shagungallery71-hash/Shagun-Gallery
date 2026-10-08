import pool from "../config/dbconfig.js";
import { v2 as cloudinary } from 'cloudinary';

// =============================================================================
// PUBLIC ENDPOINTS - Job Listings
// =============================================================================

/**
 * Get all active jobs (public)
 * GET /api/careers/jobs
 */
export const getActiveJobs = async (req, res) => {
    try {
        const { department, type, level } = req.query;

        let query = `
            SELECT 
                id, title, department, location, employment_type, 
                experience_level, salary_min, salary_max, description,
                is_featured, application_deadline, positions_available, created_at
            FROM jobs 
            WHERE is_active = true
        `;
        const params = [];
        let paramCount = 0;

        if (department) {
            paramCount++;
            query += ` AND department = $${paramCount}`;
            params.push(department);
        }

        if (type) {
            paramCount++;
            query += ` AND employment_type = $${paramCount}`;
            params.push(type);
        }

        if (level) {
            paramCount++;
            query += ` AND experience_level = $${paramCount}`;
            params.push(level);
        }

        query += ` ORDER BY is_featured DESC, created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs"
        });
    }
};

/**
 * Get single job details (public)
 * GET /api/careers/jobs/:id
 */
export const getJobDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT * FROM jobs WHERE id = $1 AND is_active = true
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error fetching job details:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch job details"
        });
    }
};

/**
 * Get unique departments (for filters)
 * GET /api/careers/departments
 */
export const getDepartments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT department FROM jobs 
            WHERE is_active = true AND department IS NOT NULL
            ORDER BY department
        `);

        res.json({
            success: true,
            data: result.rows.map(r => r.department)
        });
    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch departments"
        });
    }
};

/**
 * Submit job application (public)
 * POST /api/careers/apply
 */
export const submitApplication = async (req, res) => {
    try {
        const {
            job_id,
            full_name,
            email,
            phone,
            resume_url,
            cover_letter,
            linkedin_url,
            portfolio_url,
            years_of_experience,
            current_company,
            applicant_role,
            expected_salary,
            notice_period
        } = req.body;

        // Validate required fields
        if (!job_id || !full_name || !email) {
            return res.status(400).json({
                success: false,
                message: "Job ID, full name, and email are required"
            });
        }

        // Check if job exists and is active
        const jobCheck = await pool.query(
            'SELECT id, title FROM jobs WHERE id = $1 AND is_active = true',
            [job_id]
        );

        if (jobCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job posting not found or no longer active"
            });
        }

        // Check for duplicate application
        const duplicateCheck = await pool.query(
            'SELECT id FROM job_applications WHERE job_id = $1 AND email = $2',
            [job_id, email]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "You have already applied for this position"
            });
        }

        // Insert application
        const result = await pool.query(`
            INSERT INTO job_applications (
                job_id, full_name, email, phone, resume_url, cover_letter,
                linkedin_url, portfolio_url, years_of_experience, current_company,
                applicant_role, expected_salary, notice_period, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
            RETURNING id, created_at
        `, [
            job_id, full_name, email, phone, resume_url, cover_letter,
            linkedin_url, portfolio_url, years_of_experience, current_company,
            applicant_role, expected_salary, notice_period
        ]);

        res.status(201).json({
            success: true,
            message: "Application submitted successfully! We will review your application and get back to you soon.",
            data: {
                application_id: result.rows[0].id,
                job_title: jobCheck.rows[0].title,
                submitted_at: result.rows[0].created_at
            }
        });
    } catch (error) {
        console.error("Error submitting application:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit application"
        });
    }
};

/**
 * Upload resume to Cloudinary
 * POST /api/careers/upload-resume
 */
export const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'resumes',
                    resource_type: 'auto',
                    public_id: `resume_${Date.now()}.${req.file.mimetype.includes('pdf') ? 'pdf' : 'docx'}`,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        res.json({
            success: true,
            message: "Resume uploaded successfully",
            data: {
                url: result.secure_url,
                public_id: result.public_id
            }
        });
    } catch (error) {
        console.error("Error uploading resume:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload resume"
        });
    }
};

/**
 * Proxy download resume to avoid CORS/Auth issues
 * GET /api/careers/download-resume
 */
export const downloadResume = async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, message: 'URL is required' });
        }

        // Validate URL domain for security
        if (!url.includes('cloudinary.com')) {
            return res.status(400).json({ success: false, message: 'Invalid URL source' });
        }

        const https = await import('https');

        const fetchFile = (fileUrl) => {
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ShagungBot/1.0)'
                }
            };

            https.get(fileUrl, options, (response) => {
                // Handle Redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    if (response.headers.location) {
                        return fetchFile(response.headers.location);
                    }
                }

                if (response.statusCode !== 200) {
                    // Consume data to clear buffer
                    response.resume();
                    console.error('Cloudinary fetch failed:', response.statusCode);
                    return res.status(response.statusCode).send('Failed to fetch file from provider');
                }

                // Forward headers
                res.setHeader('Content-Type', response.headers['content-type']);
                res.setHeader('Content-Length', response.headers['content-length']);

                // Force download using provided filename or derived from URL
                // Fix path syntax for Windows/Url compatibility
                const rawFilename = url.split('/').pop().split('?')[0];
                const filename = rawFilename || 'resume.pdf';

                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

                response.pipe(res);
            }).on('error', (err) => {
                console.error('Proxy request error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Proxy connection failed' });
                }
            });
        };

        fetchFile(url);

    } catch (error) {
        console.error('Download proxy error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Download failed' });
        }
    }
};

// =============================================================================
// ADMIN ENDPOINTS - Jobs Management
// =============================================================================

/**
 * Get all jobs (admin) - including inactive
 * GET /api/careers/admin/jobs
 */
export const getAllJobsAdmin = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT j.*, 
                   (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as applications_count
            FROM jobs j
            ORDER BY j.created_at DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs"
        });
    }
};

/**
 * Create a new job (admin)
 * POST /api/careers/admin/jobs
 */
export const createJob = async (req, res) => {
    try {
        const {
            title,
            department,
            location,
            employment_type,
            experience_level,
            salary_min,
            salary_max,
            description,
            requirements,
            responsibilities,
            benefits,
            is_active = true,
            is_featured = false,
            application_deadline,
            positions_available = 1
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO jobs (
                title, department, location, employment_type, experience_level,
                salary_min, salary_max, description, requirements, responsibilities,
                benefits, is_active, is_featured, application_deadline, positions_available
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `, [
            title, department, location, employment_type, experience_level,
            salary_min, salary_max, description, requirements, responsibilities,
            benefits, is_active, is_featured, application_deadline, positions_available
        ]);

        res.status(201).json({
            success: true,
            message: "Job created successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create job"
        });
    }
};

/**
 * Update a job (admin)
 * PUT /api/careers/admin/jobs/:id
 */
export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            department,
            location,
            employment_type,
            experience_level,
            salary_min,
            salary_max,
            description,
            requirements,
            responsibilities,
            benefits,
            is_active,
            is_featured,
            application_deadline,
            positions_available
        } = req.body;

        const result = await pool.query(`
            UPDATE jobs SET
                title = COALESCE($1, title),
                department = COALESCE($2, department),
                location = COALESCE($3, location),
                employment_type = COALESCE($4, employment_type),
                experience_level = COALESCE($5, experience_level),
                salary_min = COALESCE($6, salary_min),
                salary_max = COALESCE($7, salary_max),
                description = COALESCE($8, description),
                requirements = COALESCE($9, requirements),
                responsibilities = COALESCE($10, responsibilities),
                benefits = COALESCE($11, benefits),
                is_active = COALESCE($12, is_active),
                is_featured = COALESCE($13, is_featured),
                application_deadline = COALESCE($14, application_deadline),
                positions_available = COALESCE($15, positions_available),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $16
            RETURNING *
        `, [
            title, department, location, employment_type, experience_level,
            salary_min, salary_max, description, requirements, responsibilities,
            benefits, is_active, is_featured, application_deadline, positions_available, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        res.json({
            success: true,
            message: "Job updated successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update job"
        });
    }
};

/**
 * Delete a job (admin)
 * DELETE /api/careers/admin/jobs/:id
 */
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM jobs WHERE id = $1 RETURNING id, title',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        res.json({
            success: true,
            message: `Job "${result.rows[0].title}" deleted successfully`
        });
    } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete job"
        });
    }
};

/**
 * Toggle job status (admin)
 * PATCH /api/careers/admin/jobs/:id/toggle
 */
export const toggleJobStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE jobs 
            SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        res.json({
            success: true,
            message: `Job ${result.rows[0].is_active ? 'activated' : 'deactivated'}`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error toggling job status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to toggle job status"
        });
    }
};

// =============================================================================
// ADMIN ENDPOINTS - Applications Management
// =============================================================================

/**
 * Get all applications (admin)
 * GET /api/careers/admin/applications
 */
export const getAllApplications = async (req, res) => {
    try {
        const { job_id, status } = req.query;

        let query = `
            SELECT 
                a.*,
                j.title as job_title,
                j.department
            FROM job_applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (job_id) {
            paramCount++;
            query += ` AND a.job_id = $${paramCount}`;
            params.push(job_id);
        }

        if (status) {
            paramCount++;
            query += ` AND a.status = $${paramCount}`;
            params.push(status);
        }

        query += ` ORDER BY a.created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch applications"
        });
    }
};

/**
 * Get single application details (admin)
 * GET /api/careers/admin/applications/:id
 */
export const getApplicationDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                a.*,
                j.title as job_title,
                j.department,
                j.location
            FROM job_applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error fetching application:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch application"
        });
    }
};

/**
 * Update application status (admin)
 * PATCH /api/careers/admin/applications/:id/status
 */
export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        const validStatuses = ['pending', 'reviewing', 'shortlisted', 'interview', 'rejected', 'hired'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
            });
        }

        const result = await pool.query(`
            UPDATE job_applications 
            SET 
                status = COALESCE($1, status),
                admin_notes = COALESCE($2, admin_notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [status, admin_notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        res.json({
            success: true,
            message: "Application updated successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update application"
        });
    }
};

/**
 * Delete application (admin)
 * DELETE /api/careers/admin/applications/:id
 */
export const deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM job_applications WHERE id = $1 RETURNING id, full_name',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        res.json({
            success: true,
            message: `Application from "${result.rows[0].full_name}" deleted successfully`
        });
    } catch (error) {
        console.error("Error deleting application:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete application"
        });
    }
};

/**
 * Get careers statistics (admin)
 * GET /api/careers/admin/stats
 */
export const getCareersStats = async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM jobs WHERE is_active = true) as active_jobs,
                (SELECT COUNT(*) FROM jobs) as total_jobs,
                (SELECT COUNT(*) FROM job_applications) as total_applications,
                (SELECT COUNT(*) FROM job_applications WHERE status = 'pending') as pending_applications,
                (SELECT COUNT(*) FROM job_applications WHERE status = 'shortlisted') as shortlisted,
                (SELECT COUNT(*) FROM job_applications WHERE status = 'hired') as hired
        `);

        res.json({
            success: true,
            data: stats.rows[0]
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics"
        });
    }
};
