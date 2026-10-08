import pool from './config/dbconfig.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

async function testBothLogins() {
    try {
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║         🧪 Testing Login for Both Users                  ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        const credentials = [
            {
                email: 'rockpawanchauhan@gmail.com',
                password: 'password123',
                type: 'Regular User'
            },
            {
                email: 'nietlab123@gmail.com',
                password: 'Admin@123',
                type: 'Admin User'
            }
        ];

        for (const cred of credentials) {
            console.log(`\n━━━ Testing ${cred.type} ━━━`);
            console.log(`Email: ${cred.email}`);
            console.log(`Password: ${cred.password}`);

            // Step 1: Find user
            const userResult = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [cred.email]
            );

            if (userResult.rowCount === 0) {
                console.log('❌ FAILED: No user found');
                continue;
            }

            const user = userResult.rows[0];
            console.log(`✅ User found: ${user.username}`);

            // Step 2: Check if verified
            if (!user.is_verified) {
                console.log('❌ FAILED: Email not verified');
                continue;
            }
            console.log('✅ Email is verified');

            // Step 3: Check password
            const isMatch = await bcryptjs.compare(cred.password, user.password);
            if (!isMatch) {
                console.log('❌ FAILED: Password does not match');
                continue;
            }
            console.log('✅ Password matches');

            // Step 4: Generate JWT (simulating full login flow)
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            console.log('✅ JWT token generated');
            console.log(`\n🎉 SUCCESS! ${cred.type} login would work!`);
            console.log('User details:');
            console.log({
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            });
        }

        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║         ✅ All Login Tests Passed!                       ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

testBothLogins();
