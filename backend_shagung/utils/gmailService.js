import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create reusable transporter using Gmail
let transporter = null;

const initTransporter = () => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.warn('⚠️ Gmail credentials not configured. Email sending disabled.');
        return null;
    }

    try {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });
        console.log('✅ Email service initialized with Gmail');
        return transporter;
    } catch (error) {
        console.error('❌ Failed to initialize email transporter:', error.message);
        return null;
    }
};

// Initialize on module load
initTransporter();

/**
 * Send email directly (without queue)
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    if (!transporter) {
        console.error('❌ Email transporter not initialized');
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const result = await transporter.sendMail({
            from: `"Shagun Gallery" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html: html || undefined,
            text: text || undefined,
        });

        console.log(`✅ Email sent to: ${to}`);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email, name) => {
    return sendEmail({
        to: email,
        subject: 'Welcome to Shagun Gallery! 🎉',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Shagun Gallery!</h1>
                </div>
                <div style="padding: 40px; background: #f9fafb; border-radius: 0 0 16px 16px;">
                    <p style="font-size: 18px; color: #374151;">Hello ${name}! 👋</p>
                    <p style="color: #6b7280; line-height: 1.6;">
                        Thank you for joining Shagun Gallery. We're excited to have you as part of our fashion community!
                    </p>
                    <p style="color: #6b7280; line-height: 1.6;">
                        Explore our latest collections and enjoy exclusive member benefits.
                    </p>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                       style="display: inline-block; margin-top: 20px; padding: 14px 32px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        Start Shopping
                    </a>
                </div>
            </div>
        `,
    });
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (email, order) => {
    const itemsHtml = order.items?.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                ${item.product_name || item.name}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                ${item.quantity}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                ₹${(item.price * item.quantity).toLocaleString()}
            </td>
        </tr>
    `).join('') || '';

    return sendEmail({
        to: email,
        subject: `Order Confirmed - ${order.order_number} 🎉`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0;">Order Confirmed! ✅</h1>
                    <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Order #${order.order_number}</p>
                </div>
                <div style="padding: 40px; background: #ffffff;">
                    <h2 style="color: #374151; margin-top: 0;">Order Summary</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f3f4f6;">
                                <th style="padding: 12px; text-align: left;">Item</th>
                                <th style="padding: 12px; text-align: center;">Qty</th>
                                <th style="padding: 12px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <div style="margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 8px;">
                        <p style="margin: 8px 0; color: #6b7280;">Subtotal: ₹${order.subtotal?.toLocaleString() || '0'}</p>
                        <p style="margin: 8px 0; color: #6b7280;">Shipping: ₹${order.shipping_cost?.toLocaleString() || '0'}</p>
                        <p style="margin: 8px 0; font-weight: bold; font-size: 18px; color: #111827;">Total: ₹${order.total?.toLocaleString() || '0'}</p>
                    </div>
                </div>
                <div style="padding: 20px; background: #f3f4f6; border-radius: 0 0 16px 16px; text-align: center;">
                    <p style="color: #6b7280; margin: 0;">Thank you for shopping with Shagun Gallery!</p>
                </div>
            </div>
        `,
    });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    return sendEmail({
        to: email,
        subject: 'Reset Your Password - Shagun Gallery',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0;">Password Reset</h1>
                </div>
                <div style="padding: 40px; background: #ffffff;">
                    <p style="color: #374151; line-height: 1.6;">
                        You requested a password reset for your Shagun Gallery account.
                    </p>
                    <p style="color: #374151; line-height: 1.6;">
                        Click the button below to reset your password. This link will expire in 1 hour.
                    </p>
                    <a href="${resetUrl}" 
                       style="display: inline-block; margin-top: 20px; padding: 14px 32px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        Reset Password
                    </a>
                    <p style="color: #9ca3af; margin-top: 24px; font-size: 14px;">
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
            </div>
        `,
    });
};

/**
 * Send OTP verification email
 */
export const sendOTPEmail = async (email, otp) => {
    return sendEmail({
        to: email,
        subject: 'Your Verification Code - Shagun Gallery',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0;">Verification Code</h1>
                </div>
                <div style="padding: 40px; background: #ffffff; text-align: center;">
                    <p style="color: #374151; line-height: 1.6;">
                        Your verification code is:
                    </p>
                    <div style="background: #f3f4f6; padding: 20px 40px; border-radius: 12px; display: inline-block; margin: 20px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #374151;">${otp}</span>
                    </div>
                    <p style="color: #9ca3af; font-size: 14px;">
                        This code will expire in 10 minutes.
                    </p>
                </div>
            </div>
        `,
    });
};

export default { sendEmail, sendWelcomeEmail, sendOrderConfirmationEmail, sendPasswordResetEmail, sendOTPEmail };
