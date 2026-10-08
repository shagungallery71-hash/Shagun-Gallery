// =============================================================================
// REDIS CONFIGURATION - HYBRID (Upstash REST + Native Redis)
// =============================================================================

import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// =============================================================================
// REDIS CLIENT INITIALIZATION
// =============================================================================

let redisClient = null;
let redisType = 'none'; // 'upstash' or 'ioredis'
let redisAvailable = false;

const initializeRedis = () => {
    // 1. Try Upstash REST API (Preferred for serverless/Edge)
    // Checks for specific Upstash REST variables
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        try {
            const client = new UpstashRedis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
            redisType = 'upstash';
            redisAvailable = true;
            console.log('✅ Redis (Upstash REST) client initialized');
            return client;
        } catch (error) {
            console.warn('⚠️ Failed to initialize Upstash REST:', error.message);
        }
    }

    // 2. Try Native Redis URL (Preferred for long-running servers)
    // Supports rediss:// (TLS) and redis:// protocols
    const nativeUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

    if (nativeUrl && nativeUrl.startsWith('redis')) {
        try {
            const client = new IORedis(nativeUrl, {
                tls: nativeUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
                enableOfflineQueue: false // Fail fast if disconnected
            });

            client.on('connect', () => {
                console.log('✅ Redis (Native/IORedis) connected');
                redisAvailable = true;
            });

            client.on('error', (err) => {
                console.warn('⚠️ Redis (Native) error:', err.message);
                redisAvailable = false;
            });

            redisType = 'ioredis';
            return client;
        } catch (error) {
            console.warn('⚠️ Failed to initialize IORedis:', error.message);
        }
    }

    console.warn('⚠️ No valid Redis configuration found.');
    console.warn('   - For Upstash REST: Set UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN');
    console.warn('   - For Native Redis: Set REDIS_URL (starts with redis:// or rediss://)');
    return null;
};

redisClient = initializeRedis();

// =============================================================================
// UNIFIED CACHE INTERFACE (Adapter for both clients)
// =============================================================================

const redisAdapter = {
    // GET
    get: async (key) => {
        if (!redisAvailable || !redisClient) return null;
        try {
            if (redisType === 'upstash') {
                return await redisClient.get(key);
            } else {
                const val = await redisClient.get(key);
                // IORedis returns string, Upstash auto-parses JSON usually.
                // We'll trust the consumer to parse if needed, or parse here.
                // Our cacheService handles parsing, so raw string is fine?
                // Actually Upstash REST returns the object if stored as JSON.
                // IORedis returns string. We should try partial compatibility.
                try { return JSON.parse(val); } catch { return val; }
            }
        } catch (e) {
            console.warn(`Redis GET error for ${key}:`, e.message);
            return null;
        }
    },

    // SET (with TTL)
    set: async (key, value, options = {}) => {
        if (!redisAvailable || !redisClient) return null;
        try {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;

            if (redisType === 'upstash') {
                return await redisClient.set(key, value, options);
            } else {
                if (options.ex) {
                    return await redisClient.set(key, stringValue, 'EX', options.ex);
                } else {
                    return await redisClient.set(key, stringValue);
                }
            }
        } catch (e) {
            console.warn(`Redis SET error for ${key}:`, e.message);
            return null;
        }
    },

    // DEL (supports single or multiple keys)
    del: async (...keys) => {
        if (!redisAvailable || !redisClient || keys.length === 0) return 0;
        try {
            // Flatten keys in case an array is passed accidentally, though rest args handles comma-separated
            const flatKeys = keys.flat();
            if (redisType === 'upstash') {
                return await redisClient.del(...flatKeys);
            } else {
                return await redisClient.del(...flatKeys);
            }
        } catch (e) {
            console.warn(`Redis DEL error for ${keys}:`, e.message);
            return 0;
        }
    },

    // KEYS (Scan)
    keys: async (pattern) => {
        if (!redisAvailable || !redisClient) return [];
        try {
            return await redisClient.keys(pattern);
        } catch (e) {
            console.warn(`Redis KEYS error for ${pattern}:`, e.message);
            return [];
        }
    },

    // PING
    ping: async () => {
        if (!redisAvailable || !redisClient) throw new Error('Redis not connected');
        if (redisType === 'upstash') {
            // Upstash REST client might not have ping, use dbsize or time
            return await redisClient.dbsize();
        }
        return await redisClient.ping();
    },

    // SETEX (key, ttl, value) - Required by cacheService
    setex: async (key, ttl, value) => {
        if (!redisAvailable || !redisClient) return null;
        try {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;

            if (redisType === 'upstash') {
                // Upstash REST: set(key, value, { ex: ttl })
                return await redisClient.set(key, stringValue, { ex: ttl });
            } else {
                // IORedis: setex(key, ttl, value)
                return await redisClient.setex(key, ttl, stringValue);
            }
        } catch (e) {
            console.warn(`Redis SETEX error for ${key}:`, e.message);
            return null;
        }
    },

    // FLUSHDB - Required by clearAllCache
    flushdb: async () => {
        if (!redisAvailable || !redisClient) return null;
        try {
            return await redisClient.flushdb();
        } catch (e) {
            console.warn(`Redis FLUSHDB error:`, e.message);
            return null;
        }
    }
};

// =============================================================================
// IN-MEMORY CACHE FALLBACK (When Redis is unavailable)
// =============================================================================

class InMemoryCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
        console.log('📦 In-Memory Cache initialized (Redis fallback)');
    }

    async get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if expired
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    async set(key, value, options = {}) {
        const ttl = options.ex;

        // If TTL is 0 or undefined, cache forever (no expiration)
        if (!ttl || ttl === 0) {
            this.cache.set(key, { value, expiresAt: null });

            // Clear existing timer if any
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
                this.timers.delete(key);
            }
            return 'OK';
        }

        const expiresAt = Date.now() + (ttl * 1000);
        this.cache.set(key, { value, expiresAt });

        // Clear existing timer if any
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Set auto-cleanup timer
        const timer = setTimeout(() => {
            this.cache.delete(key);
            this.timers.delete(key);
        }, ttl * 1000);

        this.timers.set(key, timer);
        return 'OK';
    }

    async setex(key, ttl, value) {
        // If TTL is 0, cache forever
        if (!ttl || ttl === 0) {
            return this.set(key, value, {});
        }
        return this.set(key, value, { ex: ttl });
    }

    async del(...keys) {
        let deleted = 0;
        for (const key of keys.flat()) {
            if (this.cache.has(key)) {
                this.cache.delete(key);
                if (this.timers.has(key)) {
                    clearTimeout(this.timers.get(key));
                    this.timers.delete(key);
                }
                deleted++;
            }
        }
        return deleted;
    }

    async keys(pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return Array.from(this.cache.keys()).filter(key => regex.test(key));
    }

    async flushdb() {
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.cache.clear();
        this.timers.clear();
        return 'OK';
    }

    async ping() {
        return 'PONG';
    }

    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()).slice(0, 20),
        };
    }
}

// Create in-memory cache instance
const inMemoryCache = new InMemoryCache();

// =============================================================================
// EXPORTS
// =============================================================================

// Always return true - we have in-memory fallback
export const isRedisAvailable = () => true;

export const markRedisFailed = () => {
    redisAvailable = false;
    console.warn('⚠️ Redis marked as unavailable - using in-memory cache');
};

export const testRedisConnection = async () => {
    try {
        await redisAdapter.ping();
        redisAvailable = true;
        console.log(`✅ Redis connection test passed (${redisType})`);
        return true;
    } catch (error) {
        console.warn('⚠️ Redis connection test failed:', error.message);
        markRedisFailed();
        return false;
    }
};

// Hybrid adapter - uses Redis if available, otherwise in-memory
const hybridAdapter = {
    get: async (key) => {
        if (redisAvailable && redisClient) {
            return redisAdapter.get(key);
        }
        return inMemoryCache.get(key);
    },
    set: async (key, value, options) => {
        if (redisAvailable && redisClient) {
            return redisAdapter.set(key, value, options);
        }
        return inMemoryCache.set(key, value, options);
    },
    setex: async (key, ttl, value) => {
        if (redisAvailable && redisClient) {
            return redisAdapter.setex(key, ttl, value);
        }
        return inMemoryCache.setex(key, ttl, value);
    },
    del: async (...keys) => {
        if (redisAvailable && redisClient) {
            return redisAdapter.del(...keys);
        }
        return inMemoryCache.del(...keys);
    },
    keys: async (pattern) => {
        if (redisAvailable && redisClient) {
            return redisAdapter.keys(pattern);
        }
        return inMemoryCache.keys(pattern);
    },
    flushdb: async () => {
        if (redisAvailable && redisClient) {
            return redisAdapter.flushdb();
        }
        return inMemoryCache.flushdb();
    },
    ping: async () => {
        if (redisAvailable && redisClient) {
            return redisAdapter.ping();
        }
        return inMemoryCache.ping();
    },
};

// Export the hybrid adapter
export { hybridAdapter as redis };

// Export in-memory cache for stats
export { inMemoryCache };
