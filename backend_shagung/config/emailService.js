import { getChannel } from "./rabbitmq.js";



export const sendEmailToQueue = async (emailData) => {
  const channel = getChannel();
  if (!channel) {
    throw new Error("RabbitMQ channel not available");
  }
  try {
    await channel.sendToQueue('emailQueue', Buffer.from(JSON.stringify(emailData)), { persistent: true });
    console.log("✅ Email data sent to queue");
  } catch (err) {
    console.log("❌ Error sending email data to queue:", err.message);
    throw err;
  }
}









