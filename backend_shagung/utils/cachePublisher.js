import amqp from 'amqplib';

const QUEUE_NAME = 'cacheInvalidationQueue';

let connection = null;
let channel = null;

export const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('Connected to RabbitMQ for cache invalidation');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
  }
};

export const publishCacheInvalidation = async (pattern) => {
  if (!channel) {
    console.error('RabbitMQ channel not available');
    return;
  }

  try {
    const message = JSON.stringify({ pattern, timestamp: Date.now() });
    channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });
    console.log(`Published cache invalidation for pattern: ${pattern}`);
  } catch (error) {
    console.error('Failed to publish cache invalidation:', error);
  }
};

export const closeRabbitMQ = async () => {
  if (channel) {
    await channel.close();
  }
  if (connection) {
    await connection.close();
  }
};
