/**
 * G-int History API Server - Optimized v2
 * High-performance REST API for historical time series data
 * 
 * Key optimizations:
 * - UNIFORM TIME DISTRIBUTION: Returns data points evenly across the entire time range
 * - SMART DOWNSAMPLING: Automatically adjusts sample rate based on time range
 * - EFFICIENT CACHING: LRU cache with smart TTL based on data freshness
 * - PARALLEL QUERIES: Uses connection pooling for concurrent requests
 * - INDEX-OPTIMIZED: Queries designed for btree indexes on (name, ts)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection pool - optimized for high throughput
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 30,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 60000, // 60 second query timeout for large ranges
});

// ===================== SMART CACHE =====================
// LRU cache with size limit and TTL
class SmartCache {
    constructor(maxSize = 200, defaultTTL = 60000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
    }

    getKey(query, params) {
        return `${query}:${JSON.stringify(params)}`;
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (LRU)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.data;
    }

    set(key, data, ttl = this.defaultTTL) {
        // Remove oldest entries if at capacity
        while (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            expires: Date.now() + ttl,
            created: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }

    get size() {
        return this.cache.size;
    }
}

const queryCache = new SmartCache(200, 30000); // 30s default TTL

// Test database connection and ensure indexes exist
pool.query('SELECT NOW()')
    .then(async () => {
        console.log('✓ Database connected successfully');

        // Create indexes if they don't exist (CRITICAL for performance)
        try {
            console.log('⏳ Checking database indexes...');

            // Composite index on (name, ts) - optimal for our queries
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_process_data_name_ts 
                ON public.process_data (name, ts DESC)
            `);

            // Index on ts alone for time range queries
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_process_data_ts 
                ON public.process_data (ts DESC)
            `);

            console.log('✓ Database indexes ready');
        } catch (err) {
            console.log('⚠️ Index creation skipped:', err.message);
        }
    })
    .catch(err => console.error('✗ Database connection error:', err.message));

// Middleware
app.use(cors({
    origin: true, // Allow all origins for development
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '1mb' }));

// Request timing middleware
app.use((req, res, next) => {
    req.startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        if (duration > 2000) {
            console.log(`⚠️ Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }
    });
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        cacheSize: queryCache.size,
        version: '2.0.0'
    });
});

/**
 * OPTIMIZED: Calculate optimal sampling strategy
 * Returns data points EVENLY DISTRIBUTED across the entire time range
 */
function calculateSamplingStrategy(rangeMinutes, tagCount) {
    // Target: ~100 data points per tag for smooth playback
    const targetPointsPerTag = 100;
    const totalTargetPoints = targetPointsPerTag * tagCount;

    let strategy = {
        method: 'all',      // 'all', 'sample', 'bucket_minute', 'bucket_hour'
        sampleRate: 1,      // For 'sample' method: take every Nth row
        bucketSize: null,   // For bucket methods
        maxLimit: 50000     // Safety limit
    };

    if (rangeMinutes <= 30) {
        // Very short range: return all data
        strategy.method = 'all';
        strategy.maxLimit = 100000;
    } else if (rangeMinutes <= 120) {
        // 30min - 2h: sample every 2nd-3rd row
        strategy.method = 'sample';
        strategy.sampleRate = Math.ceil(rangeMinutes / 30);
        strategy.maxLimit = 50000;
    } else if (rangeMinutes <= 360) {
        // 2-6 hours: minute buckets
        strategy.method = 'bucket_minute';
        strategy.bucketSize = Math.ceil(rangeMinutes / targetPointsPerTag);
        strategy.maxLimit = 30000;
    } else if (rangeMinutes <= 1440) {
        // 6-24 hours: 5-minute buckets
        strategy.method = 'bucket_5min';
        strategy.maxLimit = 30000;
    } else if (rangeMinutes <= 10080) {
        // 1-7 days: 15-minute buckets
        strategy.method = 'bucket_15min';
        strategy.maxLimit = 50000;
    } else {
        // > 7 days: hourly buckets
        strategy.method = 'bucket_hour';
        strategy.maxLimit = 50000;
    }

    return strategy;
}

/**
 * Build optimized query based on sampling strategy
 * KEY IMPROVEMENT: Queries are designed to return data DISTRIBUTED across the entire time range
 */
function buildQuery(strategy, tagList, start, end) {
    let query;
    let params = [tagList, start, end];

    switch (strategy.method) {
        case 'all':
            // Return all data points (for short ranges)
            query = `
                SELECT ts, name, value
                FROM public.process_data
                WHERE name = ANY($1::text[])
                  AND ts >= $2 AND ts <= $3
                ORDER BY ts ASC
                LIMIT $4
            `;
            params.push(strategy.maxLimit);
            break;

        case 'sample':
            // Sample every Nth row, but use NTILE to divide data into equal chunks
            // This ensures we get data from the ENTIRE time range, not just the beginning
            query = `
                WITH data_chunks AS (
                    SELECT ts, name, value,
                           NTILE(${Math.ceil(strategy.maxLimit / tagList.length)}) 
                               OVER (PARTITION BY name ORDER BY ts) as chunk
                    FROM public.process_data
                    WHERE name = ANY($1::text[])
                      AND ts >= $2 AND ts <= $3
                )
                SELECT ts, name, value
                FROM data_chunks
                WHERE chunk <= ${Math.ceil(100 / strategy.sampleRate)}
                   OR chunk % ${strategy.sampleRate} = 1
                ORDER BY ts ASC
                LIMIT $4
            `;
            params.push(strategy.maxLimit);
            break;

        case 'bucket_minute':
            // Get last value per minute bucket (FAST - no regex)
            query = `
                SELECT DISTINCT ON (date_trunc('minute', ts), name)
                    date_trunc('minute', ts) as ts,
                    name,
                    value
                FROM public.process_data
                WHERE name = ANY($1::text[])
                  AND ts >= $2 AND ts <= $3
                ORDER BY date_trunc('minute', ts), name, ts DESC
                LIMIT $4
            `;
            params.push(strategy.maxLimit);
            break;

        case 'bucket_5min':
            // Get last value per 5-minute bucket (FAST)
            query = `
                WITH buckets AS (
                    SELECT ts, name, value,
                        date_trunc('hour', ts) + 
                            INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM ts) / 5) as bucket
                    FROM public.process_data
                    WHERE name = ANY($1::text[])
                      AND ts >= $2 AND ts <= $3
                )
                SELECT DISTINCT ON (bucket, name)
                    bucket as ts, name, value
                FROM buckets
                ORDER BY bucket, name, ts DESC
                LIMIT $4
            `;
            params.push(strategy.maxLimit);
            break;

        case 'bucket_15min':
            // Get last value per 15-minute bucket (FAST)
            query = `
                WITH buckets AS (
                    SELECT ts, name, value,
                        date_trunc('hour', ts) + 
                            INTERVAL '15 min' * FLOOR(EXTRACT(MINUTE FROM ts) / 15) as bucket
                    FROM public.process_data
                    WHERE name = ANY($1::text[])
                      AND ts >= $2 AND ts <= $3
                )
                SELECT DISTINCT ON (bucket, name)
                    bucket as ts, name, value
                FROM buckets
                ORDER BY bucket, name, ts DESC
                LIMIT $4
            `;
            params.push(strategy.maxLimit);
            break;

        case 'bucket_hour':
            // Get last value per hour bucket (FAST)
            query = `
                SELECT DISTINCT ON (date_trunc('hour', ts), name)
                    date_trunc('hour', ts) as ts,
                    name,
                    value
                FROM public.process_data
                WHERE name = ANY($1::text[])
                  AND ts >= $2 AND ts <= $3
                ORDER BY date_trunc('hour', ts), name, ts DESC
                LIMIT $4
            `;
            params.push(strategy.maxLimit);
            break;

        default:
            throw new Error(`Unknown sampling method: ${strategy.method}`);
    }

    return { query, params };
}

/**
 * POST /api/history/tags - OPTIMIZED
 * Query historical tag values with smart sampling
 */
app.post('/api/history/tags', async (req, res) => {
    try {
        const { tagNames, startTime, endTime, limit } = req.body;

        if (!tagNames || !Array.isArray(tagNames) || !startTime || !endTime) {
            return res.status(400).json({
                error: 'Missing required parameters: tagNames (array), startTime, endTime'
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const rangeMinutes = (end - start) / (1000 * 60);

        console.log(`📊 POST /api/history/tags - ${tagNames.length} tags, ${Math.round(rangeMinutes)}min range`);

        // Calculate optimal sampling strategy
        const strategy = calculateSamplingStrategy(rangeMinutes, tagNames.length);
        if (limit) {
            strategy.maxLimit = Math.min(parseInt(limit), strategy.maxLimit);
        }

        console.log(`   Strategy: ${strategy.method}, maxLimit: ${strategy.maxLimit}`);

        // Check cache
        const cacheKey = queryCache.getKey('history-tags', { tagNames, startTime, endTime, strategy: strategy.method });
        const cached = queryCache.get(cacheKey);
        if (cached) {
            console.log('   → Cache hit!');
            return res.json({ ...cached, fromCache: true });
        }

        // Build and execute query
        const { query, params } = buildQuery(strategy, tagNames, start, end);

        const queryStart = Date.now();
        const result = await pool.query(query, params);
        const queryTime = Date.now() - queryStart;

        console.log(`   → Query returned ${result.rows.length} rows in ${queryTime}ms`);

        // Get time range of actual data
        let dataStart = null, dataEnd = null;
        if (result.rows.length > 0) {
            dataStart = result.rows[0].ts;
            dataEnd = result.rows[result.rows.length - 1].ts;
        }

        const response = {
            count: result.rows.length,
            tagCount: tagNames.length,
            requestedRange: { start: startTime, end: endTime },
            actualRange: dataStart ? { start: dataStart, end: dataEnd } : null,
            rangeMinutes: Math.round(rangeMinutes),
            samplingMethod: strategy.method,
            queryTimeMs: queryTime,
            data: result.rows
        };

        // Cache with TTL based on data freshness
        // Older data can be cached longer
        const dataAge = Date.now() - end.getTime();
        const cacheTTL = dataAge > 3600000 ? 120000 : 30000; // 2min for old data, 30s for recent
        queryCache.set(cacheKey, response, cacheTTL);

        return res.json(response);

    } catch (error) {
        console.error('❌ Error querying tags history:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

/**
 * GET /api/history/tags - Same as POST but with query params
 */
app.get('/api/history/tags', async (req, res) => {
    try {
        const { tagNames, startTime, endTime, limit } = req.query;

        if (!tagNames || !startTime || !endTime) {
            return res.status(400).json({
                error: 'Missing required parameters: tagNames, startTime, endTime'
            });
        }

        const tagList = tagNames.split(',').map(t => t.trim());

        // Forward to POST handler logic
        req.body = { tagNames: tagList, startTime, endTime, limit };
        return app.handle(req, res);

    } catch (error) {
        console.error('Error querying tags history:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

/**
 * GET /api/history/latest
 * Get the most recent values for specified tags (useful for live mode fallback)
 */
app.get('/api/history/latest', async (req, res) => {
    try {
        const { tagNames } = req.query;

        if (!tagNames) {
            return res.status(400).json({ error: 'Missing required parameter: tagNames' });
        }

        const tagList = tagNames.split(',').map(t => t.trim());

        const query = `
            SELECT DISTINCT ON (name) ts, name, value
            FROM public.process_data
            WHERE name = ANY($1::text[])
            ORDER BY name, ts DESC
        `;

        const result = await pool.query(query, [tagList]);

        res.json({
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Error querying latest values:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

/**
 * GET /api/history/notifications
 * Query historical notification/alarm events
 */
app.get('/api/history/notifications', async (req, res) => {
    try {
        const { startTime, endTime, tagNames, limit = 500, offset = 0 } = req.query;

        if (!startTime || !endTime) {
            return res.status(400).json({
                error: 'Missing required parameters: startTime, endTime'
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const maxLimit = Math.min(parseInt(limit), 1000);
        const queryOffset = parseInt(offset) || 0;

        let query;
        let params;

        if (tagNames) {
            const tagList = tagNames.split(',').map(t => t.trim());
            query = `
                SELECT ts, name, value
                FROM public.process_data
                WHERE name = ANY($1::text[])
                  AND ts >= $2 AND ts <= $3
                ORDER BY ts DESC
                LIMIT $4 OFFSET $5
            `;
            params = [tagList, start, end, maxLimit, queryOffset];
        } else {
            query = `
                SELECT ts, name, value
                FROM public.process_data
                WHERE ts >= $1 AND ts <= $2
                  AND (value = 'true' OR value = '1' OR value = 'false' OR value = '0')
                ORDER BY ts DESC
                LIMIT $3 OFFSET $4
            `;
            params = [start, end, maxLimit, queryOffset];
        }

        const result = await pool.query(query, params);

        res.json({
            count: result.rows.length,
            timeRange: { start: startTime, end: endTime },
            data: result.rows
        });

    } catch (error) {
        console.error('Error querying notifications:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

/**
 * GET /api/history/tag-names
 * Get list of all unique tag names
 */
app.get('/api/history/tag-names', async (req, res) => {
    try {
        const cacheKey = 'tag-names';
        const cached = queryCache.get(cacheKey);
        if (cached) {
            return res.json({ ...cached, fromCache: true });
        }

        const result = await pool.query(`
            SELECT DISTINCT name 
            FROM public.process_data 
            ORDER BY name
            LIMIT 1000
        `);

        const response = {
            count: result.rows.length,
            tags: result.rows.map(r => r.name)
        };

        queryCache.set(cacheKey, response, 300000); // Cache for 5 minutes
        res.json(response);

    } catch (error) {
        console.error('Error querying tag names:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

/**
 * GET /api/history/stats
 * Get database statistics
 */
app.get('/api/history/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_rows,
                MIN(ts) as earliest_data,
                MAX(ts) as latest_data,
                COUNT(DISTINCT name) as unique_tags
            FROM public.process_data
        `);

        res.json({
            ...result.rows[0],
            poolStats: {
                totalCount: pool.totalCount,
                idleCount: pool.idleCount,
                waitingCount: pool.waitingCount
            },
            cacheSize: queryCache.size,
            version: '2.0.0'
        });

    } catch (error) {
        console.error('Error querying stats:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

/**
 * POST /api/cache/clear
 * Clear the query cache
 */
app.post('/api/cache/clear', (req, res) => {
    const sizeBefore = queryCache.size;
    queryCache.clear();
    res.json({
        message: 'Cache cleared',
        entriesCleared: sizeBefore
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await pool.end();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   G-int History API Server v2.0 (Optimized)               ║
║   Running on http://localhost:${PORT}                        ║
╠═══════════════════════════════════════════════════════════╣
║   Features:                                               ║
║   ✓ Smart time-based sampling                             ║
║   ✓ Data distributed across ENTIRE time range             ║
║   ✓ LRU cache with smart TTL                              ║
║   ✓ Bucket aggregation: minute/5min/15min/hour            ║    
║   ✓ CORS enabled for all origins                          ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
