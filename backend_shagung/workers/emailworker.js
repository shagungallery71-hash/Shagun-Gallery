import amqplib from "amqplib"; // ✅ correct

import dotenv from 'dotenv'
dotenv.config();
import nodemailer from "nodemailer";

const queue = 'emailQueue';

const startWorker = async () => {
  const connection = await amqplib.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });
  console.log("Email Worker is waiting for messages in %s", queue);


  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const emailData = JSON.parse(msg.content.toString());
      console.log("Send email to : ", emailData.to);
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Shagun Gallery" <${process.env.GMAIL_USER}>`,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
        });

        console.log("✅ Email sent successfully to:", emailData.to);
        channel.ack(msg);

      }
      catch (err) {
        console.error("❌ Email send failed:", err);
        channel.nack(msg);
      }
    }
  })



}

startWorker();  
