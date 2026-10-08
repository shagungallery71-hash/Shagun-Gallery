import crypto from 'crypto';
import pool from '../config/dbconfig.js';

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox';

// Cashfree API base URLs
const CASHFREE_BASE_URL = CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

// Check if Cashfree is configured
const isCashfreeConfigured = () => {
    return CASHFREE_APP_ID &&
        CASHFREE_SECRET_KEY &&
        !CASHFREE_APP_ID.includes('YOUR_') &&
        !CASHFREE_SECRET_KEY.includes('YOUR_');
};

// Debug: Log Cashfree configuration on startup (mask sensitive data)
console.log('🔧 Cashfree Configuration:');
console.log('   - Environment:', CASHFREE_ENV);
console.log('   - Base URL:', CASHFREE_BASE_URL);
console.log('   - App ID:', CASHFREE_APP_ID ? `${CASHFREE_APP_ID.substring(0, 10)}...` : '❌ NOT SET');
console.log('   - Secret Key:', CASHFREE_SECRET_KEY ? `${CASHFREE_SECRET_KEY.substring(0, 15)}...` : '❌ NOT SET');

if (isCashfreeConfigured()) {
    console.log(`✅ Cashfree payment service initialized (${CASHFREE_ENV} mode)`);
} else {
    console.warn('⚠️ Cashfree not configured - add API keys to enable payments');
    console.warn('   Missing: CASHFREE_APP_ID or CASHFREE_SECRET_KEY in .env');
}

// =============================================================================
// CREATE CASHFREE ORDER (Payment Session)
// =============================================================================
export const createPaymentIntent = async (req, res) => {
    if (!isCashfreeConfigured()) {
        return res.status(503).json({
            success: false,
            message: 'Payment service not configured. Please add Cashfree API keys.',
        });
    }

    try {
        const { amount, currency = 'INR', metadata = {} } = req.body;
        const userId = req.user?.id;
        const userEmail = req.user?.email || metadata.email || 'customer@example.com';
        const userPhone = metadata.phone || '9999999999';
        const userName = req.user?.username || metadata.name || 'Customer';

        // Debug logging - what amount did we receive?
        console.log('💰 Cashfree Payment Request:', {
            receivedAmount: amount,
            currency,
            userId,
            couponCode: metadata.couponCode,
            originalAmount: metadata.originalAmount,
            discountAmount: metadata.discountAmount,
        });

        if (!amount || amount < 1) {
            return res.status(400).json({
                success: false,
                message: 'Amount is required and must be at least 1',
            });
        }

        // Generate unique order ID
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Cashfree Create Order API
        const orderPayload = {
            order_id: orderId,
            order_amount: parseFloat(amount).toFixed(2),
            order_currency: currency.toUpperCase(),
            customer_details: {
                customer_id: userId?.toString() || `guest_${Date.now()}`,
                customer_email: userEmail,
                customer_phone: userPhone,
                customer_name: userName,
            },
            // Note: order_meta removed - Cashfree production requires HTTPS URLs
            // We verify payment via API after modal checkout completes
            order_note: metadata.note || 'Payment for order',
        };

        // Log what we're sending to Cashfree
        console.log('📤 Sending to Cashfree:', {
            url: `${CASHFREE_BASE_URL}/orders`,
            orderId,
            orderAmount: orderPayload.order_amount,
            orderCurrency: orderPayload.order_currency,
            appIdPrefix: CASHFREE_APP_ID ? CASHFREE_APP_ID.substring(0, 10) : 'NOT_SET',
        });

        const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
            },
            body: JSON.stringify(orderPayload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Cashfree Create Order Error:', {
                status: response.status,
                statusText: response.statusText,
                error: data,
                // Debug info for 401 errors
                debug: response.status === 401 ? {
                    appIdSet: !!CASHFREE_APP_ID,
                    secretSet: !!CASHFREE_SECRET_KEY,
                    environment: CASHFREE_ENV,
                    baseUrl: CASHFREE_BASE_URL,
                    hint: 'Check if .env is loaded on server and keys match environment (sandbox vs production)'
                } : null
            });
            return res.status(response.status).json({
                success: false,
                message: response.status === 401
                    ? 'Payment authentication failed. Please check API credentials.'
                    : (data.message || 'Failed to create payment order'),
                error: data,
            });
        }

        // Store payment order in database
        try {
            await pool.query(`
                INSERT INTO payment_intents (
                    stripe_payment_intent_id,
                    user_id,
                    amount,
                    currency,
                    status,
                    metadata
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                orderId,
                userId || null,
                amount,
                currency,
                data.order_status || 'ACTIVE',
                JSON.stringify({ ...metadata, cashfree_order_id: data.cf_order_id }),
            ]);
        } catch (dbErr) {
            console.warn('Could not save payment order to database:', dbErr.message);
        }

        res.json({
            success: true,
            orderId: orderId,
            cfOrderId: data.cf_order_id,
            paymentSessionId: data.payment_session_id,
            orderStatus: data.order_status,
            environment: CASHFREE_ENV,
        });
    } catch (error) {
        console.error('Create Payment Order Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message,
        });
    }
};

// =============================================================================
// VERIFY PAYMENT
// =============================================================================
export const confirmPayment = async (req, res) => {
    if (!isCashfreeConfigured()) {
        return res.status(503).json({
            success: false,
            message: 'Payment service not configured.',
        });
    }

    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }

        // Verify order status with Cashfree
        const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: 'Failed to verify payment',
                error: data,
            });
        }

        // Update status in database
        try {
            await pool.query(`
                UPDATE payment_intents 
                SET status = $1, updated_at = NOW()
                WHERE stripe_payment_intent_id = $2
            `, [data.order_status, orderId]);
        } catch (dbErr) {
            console.warn('Could not update payment order in database:', dbErr.message);
        }

        res.json({
            success: true,
            status: data.order_status,
            orderAmount: data.order_amount,
            paymentStatus: data.order_status === 'PAID' ? 'succeeded' : data.order_status.toLowerCase(),
        });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message,
        });
    }
};

// =============================================================================
// GET PAYMENT STATUS
// =============================================================================
export const getPaymentStatus = async (req, res) => {
    if (!isCashfreeConfigured()) {
        return res.status(503).json({
            success: false,
            message: 'Payment service not configured.',
        });
    }

    try {
        const { paymentIntentId: orderId } = req.params;

        const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: 'Failed to get payment status',
                error: data,
            });
        }

        res.json({
            success: true,
            status: data.order_status,
            amount: data.order_amount,
            currency: data.order_currency,
        });
    } catch (error) {
        console.error('Get Payment Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment status',
            error: error.message,
        });
    }
};

// =============================================================================
// CASHFREE WEBHOOK HANDLER
// =============================================================================
export const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        const rawBody = JSON.stringify(req.body);

        // Verify webhook signature (optional but recommended)
        if (CASHFREE_SECRET_KEY && signature) {
            const expectedSignature = crypto
                .createHmac('sha256', CASHFREE_SECRET_KEY)
                .update(timestamp + rawBody)
                .digest('base64');

            if (signature !== expectedSignature) {
                console.error('Webhook signature verification failed');
                return res.status(400).json({ error: 'Invalid signature' });
            }
        }

        const { data, type } = req.body;

        console.log(`📥 Cashfree Webhook: ${type}`);

        switch (type) {
            case 'PAYMENT_SUCCESS':
            case 'ORDER_PAID':
                console.log(`✅ Payment succeeded: ${data.order?.order_id}`);

                try {
                    await pool.query(`
                        UPDATE payment_intents 
                        SET status = 'PAID', updated_at = NOW()
                        WHERE stripe_payment_intent_id = $1
                    `, [data.order?.order_id]);

                    // Update order if metadata contains orderId
                    if (data.order?.order_tags?.orderId) {
                        await pool.query(`
                            UPDATE orders 
                            SET payment_status = 'paid', status = 'confirmed', updated_at = NOW()
                            WHERE id = $1
                        `, [data.order.order_tags.orderId]);
                    }
                } catch (dbErr) {
                    console.error('Webhook database error:', dbErr.message);
                }
                break;

            case 'PAYMENT_FAILED':
                console.log(`❌ Payment failed: ${data.order?.order_id}`);

                try {
                    await pool.query(`
                        UPDATE payment_intents 
                        SET status = 'FAILED', updated_at = NOW()
                        WHERE stripe_payment_intent_id = $1
                    `, [data.order?.order_id]);
                } catch (dbErr) {
                    console.error('Webhook database error:', dbErr.message);
                }
                break;

            case 'REFUND_STATUS':
                console.log(`🔄 Refund status update: ${data.refund?.refund_id}`);
                break;

            default:
                console.log(`Unhandled webhook event: ${type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

// =============================================================================
// CREATE REFUND
// =============================================================================
export const createRefund = async (req, res) => {
    if (!isCashfreeConfigured()) {
        return res.status(503).json({
            success: false,
            message: 'Payment service not configured.',
        });
    }

    try {
        const { orderId, amount, reason } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }

        const refundId = `refund_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const refundPayload = {
            refund_amount: amount,
            refund_id: refundId,
            refund_note: reason || 'Refund requested',
        };

        const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}/refunds`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
            },
            body: JSON.stringify(refundPayload),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: 'Failed to create refund',
                error: data,
            });
        }

        try {
            await pool.query(`
                INSERT INTO refunds (
                    stripe_refund_id,
                    stripe_payment_intent_id,
                    amount,
                    status,
                    reason
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                data.refund_id,
                orderId,
                amount,
                data.refund_status,
                reason,
            ]);
        } catch (dbErr) {
            console.warn('Could not save refund to database:', dbErr.message);
        }

        res.json({
            success: true,
            refund: {
                id: data.refund_id,
                amount: data.refund_amount,
                status: data.refund_status,
            },
        });
    } catch (error) {
        console.error('Create Refund Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create refund',
            error: error.message,
        });
    }
};

// =============================================================================
// GET PAYMENT METHODS (Not applicable for Cashfree in same way)
// =============================================================================
export const getPaymentMethods = async (req, res) => {
    // Cashfree doesn't store payment methods like Stripe
    res.json({
        success: true,
        paymentMethods: [],
        message: 'Cashfree processes payments directly without saved methods',
    });
};

// =============================================================================
// GET OR CREATE CUSTOMER (Not needed for Cashfree)
// =============================================================================
export const getOrCreateCustomer = async (req, res) => {
    // Cashfree doesn't require pre-created customers
    res.json({
        success: true,
        customerId: req.user?.id?.toString() || 'guest',
        message: 'Customer ID generated from user profile',
    });
};

// =============================================================================
// CHECK PAYMENT SERVICE STATUS
// =============================================================================
export const getPaymentServiceStatus = async (req, res) => {
    res.json({
        success: true,
        configured: isCashfreeConfigured(),
        provider: 'Cashfree',
        environment: CASHFREE_ENV,
        message: isCashfreeConfigured()
            ? `Cashfree payment service is ready (${CASHFREE_ENV} mode)`
            : 'Cashfree not configured - add API keys to enable',
    });
};

// =============================================================================
// GET PAYMENT OFFERS
// =============================================================================
export const getPaymentOffers = async (req, res) => {
    if (!isCashfreeConfigured()) {
        return res.json({ success: false, offers: [], message: 'Payment service not configured' });
    }

    try {
        const response = await fetch(`${CASHFREE_BASE_URL}/offers?offer_status=active`, {
            method: 'GET',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.warn('Cashfree Offers Error:', data);
            return res.json({ success: false, offers: [] });
        }

        // Cashfree returns array directly or inside object depending on version? 
        // Docs say array of offer objects
        const offers = Array.isArray(data) ? data : (data.offers || []);

        res.json({
            success: true,
            offers: offers.filter(o => o.offer_status === 'active')
        });
    } catch (error) {
        console.error('Fetch Payment Offers Error:', error);
        res.json({ success: false, offers: [] });
    }
};

