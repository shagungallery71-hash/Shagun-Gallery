import pool from '../config/dbconfig.js';

// =============================================================================
// GET USER ADDRESSES
// =============================================================================
export const getAddresses = async (req, res) => {
    try {
        const userId = req.user?.id;

        const result = await pool.query(`
            SELECT * FROM user_addresses 
            WHERE user_id = $1 
            ORDER BY is_default DESC, created_at DESC
        `, [userId]);

        res.json({
            success: true,
            addresses: result.rows,
        });
    } catch (error) {
        console.error('Get Addresses Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get addresses',
            error: error.message,
        });
    }
};

// =============================================================================
// ADD NEW ADDRESS
// =============================================================================
export const addAddress = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            full_name,
            phone,
            email = null,
            address_line1,
            address_line2 = null,
            city,
            state,
            postal_code,
            country = 'India',
            address_type = 'home',
            is_default = false,
        } = req.body;

        // Ensure user ID exists
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token',
            });
        }

        // Validation
        if (!full_name || !phone || !address_line1 || !city || !state || !postal_code) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: full_name, phone, address_line1, city, state, postal_code',
            });
        }

        // If this is default, unset other defaults
        if (is_default) {
            await pool.query(
                'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
                [userId]
            );
        }

        const params = [
            userId, full_name, phone, email, address_line1, address_line2,
            city, state, postal_code, country, address_type, is_default
        ].map(p => p === undefined ? null : p);

        const result = await pool.query(`
            INSERT INTO user_addresses (
                user_id, full_name, phone, email, address_line1, address_line2,
                city, state, postal_code, country, address_type, is_default
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, params);

        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            address: result.rows[0],
        });
    } catch (error) {
        console.error('Add Address Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add address',
            error: error.message,
        });
    }
};

// =============================================================================
// UPDATE ADDRESS
// =============================================================================
export const updateAddress = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { addressId } = req.params;
        const {
            full_name,
            phone,
            email = null,
            address_line1,
            address_line2 = null,
            city,
            state,
            postal_code,
            country,
            address_type,
            is_default,
        } = req.body;

        // Check ownership
        const existing = await pool.query(
            'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
            [addressId, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // If setting as default, unset others
        if (is_default) {
            await pool.query(
                'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
                [userId]
            );
        }

        const params = [
            full_name, phone, email, address_line1, address_line2,
            city, state, postal_code, country, address_type, is_default,
            addressId, userId
        ].map(p => p === undefined ? null : p);

        const result = await pool.query(`
            UPDATE user_addresses SET
                full_name = COALESCE($1, full_name),
                phone = COALESCE($2, phone),
                email = COALESCE($3, email),
                address_line1 = COALESCE($4, address_line1),
                address_line2 = COALESCE($5, address_line2),
                city = COALESCE($6, city),
                state = COALESCE($7, state),
                postal_code = COALESCE($8, postal_code),
                country = COALESCE($9, country),
                address_type = COALESCE($10, address_type),
                is_default = COALESCE($11, is_default),
                updated_at = NOW()
            WHERE id = $12 AND user_id = $13
            RETURNING *
        `, params);

        res.json({
            success: true,
            message: 'Address updated successfully',
            address: result.rows[0],
        });
    } catch (error) {
        console.error('Update Address Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update address',
            error: error.message,
        });
    }
};

// =============================================================================
// DELETE ADDRESS
// =============================================================================
export const deleteAddress = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { addressId } = req.params;

        const result = await pool.query(
            'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING *',
            [addressId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        res.json({
            success: true,
            message: 'Address deleted successfully',
        });
    } catch (error) {
        console.error('Delete Address Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address',
            error: error.message,
        });
    }
};

// =============================================================================
// SET DEFAULT ADDRESS
// =============================================================================
export const setDefaultAddress = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { addressId } = req.params;

        // Check ownership
        const existing = await pool.query(
            'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
            [addressId, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // Unset all defaults
        await pool.query(
            'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
            [userId]
        );

        // Set new default
        const result = await pool.query(
            'UPDATE user_addresses SET is_default = true WHERE id = $1 RETURNING *',
            [addressId]
        );

        res.json({
            success: true,
            message: 'Default address set successfully',
            address: result.rows[0],
        });
    } catch (error) {
        console.error('Set Default Address Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set default address',
            error: error.message,
        });
    }
};
