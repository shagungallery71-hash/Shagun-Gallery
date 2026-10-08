import pool from './config/dbconfig.js';
import bcryptjs from 'bcryptjs';

async function updatePassword() {
    try {
        const email = 'rockpawanchauhan@gmail.com';
        const newPassword = 'password123';

        console.log('\n=== Updating Password ===');
        console.log('Email:', email);
        console.log('New Password:', newPassword);

        // Hash the new password
        const hashedPassword = await bcryptjs.hash(newPassword, 10);

        // Update the password
        const result = await pool.query(
            'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email, username',
            [hashedPassword, email]
        );

        if (result.rowCount === 0) {
            console.log('❌ User not found');
        } else {
            console.log('✅ Password updated successfully!');
            console.log('User:', result.rows[0]);
            console.log('\nYou can now login with:');
            console.log('Email: rockpawanchauhan@gmail.com');
            console.log('Password: password123');
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

updatePassword();
