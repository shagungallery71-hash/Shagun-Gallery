import pool from './config/dbconfig.js';
import bcryptjs from 'bcryptjs';

async function testLogin() {
    try {
        const email = 'rockpawanchauhan@gmail.com';
        const password = 'password123';

        console.log('\n=== Testing Login ===');
        console.log('Email:', email);
        console.log('Password:', password);

        // Step 1: Find user
        const userResult = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rowCount === 0) {
            console.log('❌ No user found');
            await pool.end();
            return;
        }

        const user = userResult.rows[0];
        console.log('\n✅ User found:', user.email);

        // Step 2: Check if verified
        if (!user.is_verified) {
            console.log('❌ Email not verified');
            await pool.end();
            return;
        }
        console.log('✅ Email is verified');

        // Step 3: Check password
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            console.log('❌ Password does not match');
            await pool.end();
            return;
        }
        console.log('✅ Password matches');

        console.log('\n🎉 SUCCESS! Login would be successful');
        console.log('User details:');
        console.log({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

testLogin();
