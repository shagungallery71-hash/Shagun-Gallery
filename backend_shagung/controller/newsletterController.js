import pool from '../config/dbconfig.js';
import { sendWelcomeEmail } from '../utils/emailNotifications.js';

// =============================================================================
// SUBSCRIBE TO NEWSLETTER
// =============================================================================
export const subscribe = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Valid email is required',
            });
        }

        // Check if already subscribed
        const existing = await pool.query(
            'SELECT id, is_active FROM newsletter_subscriptions WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existing.rows.length > 0) {
            if (existing.rows[0].is_active) {
                return res.status(409).json({
                    success: false,
                    message: 'This email is already subscribed',
                });
            }

            // Re-activate subscription
            await pool.query(
                'UPDATE newsletter_subscriptions SET is_active = true, unsubscribed_at = NULL WHERE email = $1',
                [email.toLowerCase()]
            );
        } else {
            // New subscription
            await pool.query(
                'INSERT INTO newsletter_subscriptions (email) VALUES ($1)',
                [email.toLowerCase()]
            );
        }

        // Send welcome email
        try {
            await sendWelcomeEmail(email);
        } catch (emailErr) {
            console.warn('Could not send welcome email:', emailErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter! Check your email for a welcome discount.',
        });
    } catch (error) {
        console.error('Newsletter Subscribe Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to subscribe',
            error: error.message,
        });
    }
};

// =============================================================================
// UNSUBSCRIBE FROM NEWSLETTER
// =============================================================================
export const unsubscribe = async (req, res) => {
    try {
        const email = req.query.email || req.body.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        const result = await pool.query(`
      UPDATE newsletter_subscriptions 
      SET is_active = false, unsubscribed_at = NOW()
      WHERE email = $1
      RETURNING *
    `, [email.toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Email not found in our mailing list',
            });
        }

        res.json({
            success: true,
            message: 'Successfully unsubscribed from newsletter',
        });
    } catch (error) {
        console.error('Newsletter Unsubscribe Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unsubscribe',
            error: error.message,
        });
    }
};

// =============================================================================
// GET ALL SUBSCRIBERS (Admin)
// =============================================================================
export const getSubscribers = async (req, res) => {
    try {
        const { page = 1, limit = 50, active = 'true' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT email, is_active, subscribed_at, unsubscribed_at,
             COUNT(*) OVER() as total_count
      FROM newsletter_subscriptions
    `;

        if (active === 'true') {
            query += ' WHERE is_active = true';
        } else if (active === 'false') {
            query += ' WHERE is_active = false';
        }

        query += ' ORDER BY subscribed_at DESC LIMIT $1 OFFSET $2';

        const result = await pool.query(query, [limit, offset]);

        const totalCount = result.rows[0]?.total_count || 0;

        res.json({
            success: true,
            subscribers: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount: parseInt(totalCount),
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('Get Subscribers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subscribers',
            error: error.message,
        });
    }
};

// =============================================================================
// EXPORT SUBSCRIBERS (Admin)
// =============================================================================
export const exportSubscribers = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT email, subscribed_at 
      FROM newsletter_subscriptions 
      WHERE is_active = true
      ORDER BY subscribed_at DESC
    `);

        // Return as CSV
        const csv = ['Email,Subscribed Date']
            .concat(result.rows.map(row =>
                `${row.email},${new Date(row.subscribed_at).toISOString()}`
            ))
            .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=newsletter_subscribers.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export Subscribers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export subscribers',
            error: error.message,
        });
    }
};
