// =============================================================================
// CACHE MIDDLEWARE - Express middleware for automatic response caching
// =============================================================================

import {
  cacheGet,
  cacheSet,
  CacheTTL,
} from '../utils/cacheService.js';
import { isRedisAvailable } from '../config/redis.js';

console.log('✅ Cache middleware loaded (v2 - with _t stripping)');

/**
 * Cache middleware with configurable TTL
 * Automatically caches GET responses and serves from cache on subsequent requests
 * Adds `cache: true/false` to responses so developers know if data came from cache
 * 
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 * @param {Function} keyGenerator - Optional custom key generator function
 */
export const cacheMiddleware = (ttl = CacheTTL.MEDIUM, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip if Redis is not available
    if (!isRedisAvailable()) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if fresh=true is passed (cache bypass)
    if (req.query.fresh === 'true') {
      console.log(`[Cache] BYPASS - fresh=true requested`);
      return next();
    }

    // Skip caching if Cache-Control: no-cache header is present (admin requests)
    const cacheControl = req.headers['cache-control'] || '';
    if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
      console.log(`[Cache] BYPASS - Cache-Control: no-cache header present`);
      return next();
    }

    // Skip caching for authenticated user-specific routes
    if (req.user && (req.path.includes('/my') || req.path.includes('/cart'))) {
      return next();
    }

    // Generate cache key - strip _t timestamp parameter for consistent caching
    let cacheUrl = req.originalUrl;

    console.log(`[Cache] Original URL: ${cacheUrl}`);

    // Remove _t=timestamp from URL for cache key
    try {
      const url = new URL(cacheUrl, 'http://localhost');
      url.searchParams.delete('_t');
      cacheUrl = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '');
      console.log(`[Cache] Stripped URL: ${cacheUrl}`);
    } catch (e) {
      console.error(`[Cache] URL parse error: ${e.message}`);
    }

    const key = keyGenerator
      ? keyGenerator(req)
      : `api:${cacheUrl}`;

    console.log(`[Cache] Final key: ${key}`);

    try {
      // Check cache
      const cached = await cacheGet(key);
      if (cached) {
        console.log(`[Cache] HIT for ${key}`);
        res.setHeader('X-Cache', 'HIT');

        // Add cache flag to response
        const responseWithCacheFlag = typeof cached === 'object' && cached !== null
          ? { ...cached, cache: true }
          : cached;

        return res.json(responseWithCacheFlag);
      }

      console.log(`[Cache] MISS for ${key}`);

      // Cache miss - track original json method
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheSet(key, data, ttl).catch(err => {
            console.error('Cache set error:', err.message);
          });
        }

        // Add cache: false flag to fresh data response
        const responseWithCacheFlag = typeof data === 'object' && data !== null
          ? { ...data, cache: false }
          : data;

        return originalJson(responseWithCacheFlag);
      };

      next();
    } catch (error) {
      // On error, continue without caching
      console.error('Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * No-cache middleware - Ensures response is not cached
 * Use this for admin routes or user-specific data
 */
export const noCacheMiddleware = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// =============================================================================
// RE-EXPORT INVALIDATION FUNCTIONS FOR CONVENIENCE
// =============================================================================

export {
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateReviewCache,
  invalidateCouponCache,
  invalidateStatsCache,
  invalidateSalesCache,
  clearAllCache,
  invalidateByPatterns,
} from '../utils/cacheService.js';

export default cacheMiddleware;
