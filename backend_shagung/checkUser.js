import pool from './config/dbconfig.js';

async function checkUser() {
    try {
        const result = await pool.query(
            'SELECT id, username, email, is_verified, role, created_at FROM users WHERE email = $1',
            ['rockpawanchauhan@gmail.com']
        );

        console.log('\n=== User Check Results ===');
        if (result.rowCount === 0) {
            console.log('❌ No user found with email: rockpawanchauhan@gmail.com');
        } else {
            console.log('✅ User found:');
            console.log(JSON.stringify(result.rows[0], null, 2));

            if (!result.rows[0].is_verified) {
                console.log('\n⚠️  WARNING: User email is NOT VERIFIED');
                console.log('This is why login is failing!');
            } else {
                console.log('\n✅ User email IS VERIFIED');
            }
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

checkUser();
