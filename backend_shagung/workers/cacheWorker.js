import amqp from 'amqplib';
import { redis } from '../config/redis.js';

const QUEUE_NAME = 'cacheInvalidationQueue';

const startCacheWorker = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('Cache worker started, waiting for messages...');

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const { pattern } = JSON.parse(msg.content.toString());
          console.log(`Invalidating cache for pattern: ${pattern}`);

          // Get all keys matching the pattern
          const keys = await redis.keys(pattern);

          if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`Invalidated ${keys.length} cache keys`);
          }

          channel.ack(msg);
        } catch (error) {
          console.error('Error processing cache invalidation message:', error);
          channel.nack(msg, false, false);
        }
      }
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down cache worker...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start cache worker:', error);
  }
};

export { startCacheWorker };
startCacheWorker();
