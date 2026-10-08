import pool from './config/dbconfig.js';
import bcryptjs from 'bcryptjs';

async function checkPassword() {
    try {
        const email = 'rockpawanchauhan@gmail.com';
        const passwordToTest = 'password123';

        const result = await pool.query(
            'SELECT id, username, email, password, is_verified FROM users WHERE email = $1',
            [email]
        );

        console.log('\n=== Password Verification Test ===');

        if (result.rowCount === 0) {
            console.log('❌ No user found');
            await pool.end();
            return;
        }

        const user = result.rows[0];
        console.log('User found:', user.email);
        console.log('Is verified:', user.is_verified);
        console.log('Stored password hash:', user.password);

        const isMatch = await bcryptjs.compare(passwordToTest, user.password);

        console.log('\n=== Testing Password: "password123" ===');
        console.log('Password matches:', isMatch ? '✅ YES' : '❌ NO');

        if (!isMatch) {
            console.log('\n⚠️  The password in the database does NOT match "password123"');
            console.log('Either the user registered with a different password,');
            console.log('or you need to reset the password.');
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

checkPassword();
