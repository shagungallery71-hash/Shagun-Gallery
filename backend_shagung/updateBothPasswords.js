import pool from './config/dbconfig.js';
import bcryptjs from 'bcryptjs';

async function updateBothPasswords() {
    try {
        console.log('\n=== Updating Passwords for Multiple Users ===\n');

        const users = [
            {
                email: 'rockpawanchauhan@gmail.com',
                password: 'password123',
                role: 'user'
            },
            {
                email: 'nietlab123@gmail.com',
                password: 'Admin@123',
                role: 'admin'
            }
        ];

        for (const user of users) {
            console.log(`Updating ${user.role}: ${user.email}`);

            // Hash the new password
            const hashedPassword = await bcryptjs.hash(user.password, 10);

            // Update the password
            const result = await pool.query(
                'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email, username, role',
                [hashedPassword, user.email]
            );

            if (result.rowCount === 0) {
                console.log(`❌ User not found: ${user.email}`);
            } else {
                console.log(`✅ Password updated successfully!`);
                console.log(`   User: ${result.rows[0].username} (${result.rows[0].role})`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Password: ${user.password}\n`);
            }
        }

        console.log('=== Summary ===');
        console.log('You can now login with:');
        console.log('\n1. Regular User:');
        console.log('   Email: rockpawanchauhan@gmail.com');
        console.log('   Password: password123');
        console.log('\n2. Admin User:');
        console.log('   Email: nietlab123@gmail.com');
        console.log('   Password: Admin@123');

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

updateBothPasswords();
