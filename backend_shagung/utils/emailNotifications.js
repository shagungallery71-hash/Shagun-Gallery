import { sendEmailToQueue } from '../config/emailService.js';

// =============================================================================
// ORDER EMAIL TEMPLATES
// =============================================================================

const formatCurrency = (amount) => `₹${parseFloat(amount).toFixed(2)}`;

const baseEmailStyle = `
  body { margin: 0; padding: 0; background-color: #f8f4f1; font-family: 'Poppins', Arial, sans-serif; }
  .wrapper { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
  .header { background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%); color: white; text-align: center; padding: 30px 20px; }
  .header h1 { margin: 0; font-size: 24px; }
  .content { padding: 30px 40px; }
  .content h2 { font-size: 20px; color: #444; margin-bottom: 10px; }
  .content p { font-size: 14px; line-height: 1.6; color: #555; }
  .order-box { background: #fafafa; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .order-number { font-size: 18px; font-weight: 600; color: #666; }
  .item-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
  .total-row { display: flex; justify-content: space-between; padding: 15px 0; font-size: 18px; font-weight: 600; color: #333; }
  .button { display: inline-block; background: linear-gradient(90deg, #ff758c 0%, #ff7eb3 100%); color: white; padding: 14px 30px; border-radius: 50px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 15px 0; }
  .footer { background: #fafafa; text-align: center; padding: 20px; font-size: 12px; color: #777; border-top: 1px solid #eee; }
  .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .status-confirmed { background: #d4edda; color: #155724; }
  .status-shipped { background: #cce5ff; color: #004085; }
  .status-delivered { background: #d1ecf1; color: #0c5460; }
  .status-cancelled { background: #f8d7da; color: #721c24; }
`;

// =============================================================================
// ORDER CONFIRMATION EMAIL
// =============================================================================
export const sendOrderConfirmation = async (order, userEmail, userName) => {
  const items = order.items || [];
  const itemsHtml = items.map(item => `
    <div class="item-row">
      <div>
        <strong>${item.product_name}</strong>
        ${item.size ? `<br><small>Size: ${item.size}</small>` : ''}
        ${item.color ? `<small> / Color: ${item.color}</small>` : ''}
        <br><small>Qty: ${item.quantity}</small>
      </div>
      <div style="text-align: right;">
        ${formatCurrency(item.price * item.quantity)}
      </div>
    </div>
  `).join('');

  const shippingAddress = order.shipping_address || {};
  const addressHtml = `
    ${shippingAddress.full_name}<br>
    ${shippingAddress.address_line1}<br>
    ${shippingAddress.address_line2 ? shippingAddress.address_line2 + '<br>' : ''}
    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}<br>
    Phone: ${shippingAddress.phone}
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>🎉 Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Thank you, ${userName}!</h2>
          <p>Your order has been placed successfully. We're getting it ready for you!</p>
          
          <div class="order-box">
            <div class="order-number">Order #${order.order_number}</div>
            <p style="margin: 5px 0; color: #888; font-size: 12px;">
              Placed on ${new Date(order.created_at).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })}
            </p>
          </div>

          <h3 style="margin-top: 20px;">Order Items</h3>
          ${itemsHtml}
          
          <div style="margin-top: 20px; border-top: 2px solid #eee; padding-top: 15px;">
            <div class="item-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
            ${order.discount > 0 ? `<div class="item-row" style="color: #28a745;"><span>Discount</span><span>-${formatCurrency(order.discount)}</span></div>` : ''}
            <div class="item-row"><span>Shipping</span><span>${order.shipping_cost > 0 ? formatCurrency(order.shipping_cost) : 'FREE'}</span></div>
            <div class="item-row"><span>Tax (GST)</span><span>${formatCurrency(order.tax_amount)}</span></div>
            <div class="total-row"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
          </div>

          <h3 style="margin-top: 30px;">Shipping Address</h3>
          <div class="order-box" style="font-size: 14px;">
            ${addressHtml}
          </div>

          <center>
            <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="button">
              Track Your Order
            </a>
          </center>
        </div>
        <div class="footer">
          <p>Need help? Contact us at support@shagungallery.com</p>
          <p>© ${new Date().getFullYear()} ShagunGallery. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmailToQueue({
    to: userEmail,
    subject: `🛒 Order Confirmed - #${order.order_number}`,
    html,
  });

  console.log(`📧 Order confirmation email sent to ${userEmail}`);
};

// =============================================================================
// ORDER SHIPPED EMAIL
// =============================================================================
export const sendOrderShipped = async (order, userEmail, userName) => {
  const trackingInfo = order.tracking_number
    ? `<p><strong>Tracking Number:</strong> ${order.tracking_number}</p>
       ${order.tracking_url ? `<a href="${order.tracking_url}" class="button">Track Shipment</a>` : ''}`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <h1>📦 Your Order Has Shipped!</h1>
        </div>
        <div class="content">
          <h2>Hey ${userName}!</h2>
          <p>Great news! Your order <strong>#${order.order_number}</strong> is on its way to you.</p>
          
          <div class="order-box">
            <span class="status-badge status-shipped">Shipped</span>
            <p style="margin: 15px 0 5px;">
              <strong>Expected Delivery:</strong><br>
              Within 5-7 business days
            </p>
            ${trackingInfo}
          </div>

          <h3>Shipping To:</h3>
          <p>
            ${order.shipping_address?.full_name}<br>
            ${order.shipping_address?.city}, ${order.shipping_address?.state}
          </p>

          <center>
            <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="button">
              View Order Details
            </a>
          </center>
        </div>
        <div class="footer">
          <p>If you have any questions, contact support@shagungallery.com</p>
          <p>© ${new Date().getFullYear()} ShagunGallery</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmailToQueue({
    to: userEmail,
    subject: `📦 Your Order #${order.order_number} Has Shipped!`,
    html,
  });

  console.log(`📧 Order shipped email sent to ${userEmail}`);
};

// =============================================================================
// ORDER DELIVERED EMAIL
// =============================================================================
export const sendOrderDelivered = async (order, userEmail, userName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
          <h1>✅ Order Delivered!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>Your order <strong>#${order.order_number}</strong> has been delivered successfully!</p>
          
          <div class="order-box">
            <span class="status-badge status-delivered">Delivered</span>
            <p style="margin-top: 15px;">
              We hope you love your purchase! 💖
            </p>
          </div>

          <p>We'd love to hear what you think! Please take a moment to share your experience.</p>

          <center>
            <a href="${process.env.FRONTEND_URL}/orders/${order.id}/review" class="button">
              Leave a Review ⭐
            </a>
          </center>

          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            Having issues with your order? <a href="${process.env.FRONTEND_URL}/contact">Contact Support</a>
          </p>
        </div>
        <div class="footer">
          <p>Thank you for shopping with ShagunGallery!</p>
          <p>© ${new Date().getFullYear()} ShagunGallery</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmailToQueue({
    to: userEmail,
    subject: `✅ Order #${order.order_number} Delivered - Leave a Review!`,
    html,
  });

  console.log(`📧 Order delivered email sent to ${userEmail}`);
};

// =============================================================================
// ORDER CANCELLED EMAIL
// =============================================================================
export const sendOrderCancelled = async (order, userEmail, userName, reason) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);">
          <h1>Order Cancelled</h1>
        </div>
        <div class="content">
          <h2>Hi ${userName},</h2>
          <p>Your order <strong>#${order.order_number}</strong> has been cancelled.</p>
          
          <div class="order-box">
            <span class="status-badge status-cancelled">Cancelled</span>
            ${reason ? `<p style="margin-top: 15px;"><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>

          <p>If you were charged for this order, a refund will be processed within 5-7 business days.</p>

          <p>If you have any questions or this cancellation was unexpected, please contact our support team.</p>

          <center>
            <a href="${process.env.FRONTEND_URL}/contact" class="button" style="background: #6c757d;">
              Contact Support
            </a>
          </center>
        </div>
        <div class="footer">
          <p>Need help? Email us at support@shagungallery.com</p>
          <p>© ${new Date().getFullYear()} ShagunGallery</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmailToQueue({
    to: userEmail,
    subject: `Order #${order.order_number} Cancelled`,
    html,
  });

  console.log(`📧 Order cancelled email sent to ${userEmail}`);
};

// =============================================================================
// PAYMENT RECEIPT EMAIL
// =============================================================================
export const sendPaymentReceipt = async (payment, userEmail, userName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <h1>💳 Payment Received</h1>
        </div>
        <div class="content">
          <h2>Thank you, ${userName}!</h2>
          <p>We've received your payment successfully.</p>
          
          <div class="order-box">
            <table style="width: 100%;">
              <tr>
                <td><strong>Amount:</strong></td>
                <td style="text-align: right; font-size: 20px; color: #28a745;">${formatCurrency(payment.amount)}</td>
              </tr>
              <tr>
                <td><strong>Payment ID:</strong></td>
                <td style="text-align: right; font-size: 12px; color: #888;">${payment.stripe_payment_intent_id}</td>
              </tr>
              <tr>
                <td><strong>Date:</strong></td>
                <td style="text-align: right;">${new Date(payment.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #888;">
            This receipt confirms that your payment has been processed. Please keep this for your records.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ShagunGallery. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmailToQueue({
    to: userEmail,
    subject: `💳 Payment Receipt - ${formatCurrency(payment.amount)}`,
    html,
  });

  console.log(`📧 Payment receipt email sent to ${userEmail}`);
};

// =============================================================================
// WELCOME/NEWSLETTER EMAIL
// =============================================================================
export const sendWelcomeEmail = async (email) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Welcome to ShagunGallery! 💖</h1>
        </div>
        <div class="content">
          <h2>You're In!</h2>
          <p>Thanks for subscribing to our newsletter. You'll be the first to know about:</p>
          
          <ul style="line-height: 2;">
            <li>🎁 Exclusive discounts & offers</li>
            <li>✨ New arrivals & collections</li>
            <li>🎉 Special sales & events</li>
            <li>💡 Style tips & trends</li>
          </ul>

          <div class="order-box" style="text-align: center; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
            <h3 style="margin: 0;">Here's 10% Off Your First Order!</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">WELCOME10</p>
            <p style="font-size: 12px; margin: 0;">Use at checkout • Valid for 30 days</p>
          </div>

          <center>
            <a href="${process.env.FRONTEND_URL}/shop" class="button">
              Start Shopping 🛍️
            </a>
          </center>
        </div>
        <div class="footer">
          <p>You're receiving this because you subscribed at shagungallery.com</p>
          <p><a href="${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
          <p>© ${new Date().getFullYear()} ShagunGallery</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmailToQueue({
    to: email,
    subject: `Welcome to ShagunGallery! 🎉 Here's 10% Off`,
    html,
  });

  console.log(`📧 Welcome email sent to ${email}`);
};

export default {
  sendOrderConfirmation,
  sendOrderShipped,
  sendOrderDelivered,
  sendOrderCancelled,
  sendPaymentReceipt,
  sendWelcomeEmail,
};
