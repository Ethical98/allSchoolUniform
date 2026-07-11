/**
 * Query Timing Middleware
 * Logs response times for all API requests to help identify slow endpoints
 */

const queryTimingMiddleware = (req, res, next) => {
    const start = Date.now();

    // Store original end function
    const originalEnd = res.end;

    res.end = function (...args) {
        const duration = Date.now() - start;

        // Log slow queries (> 500ms)
        if (duration > 500) {
            console.warn(`[SLOW API] ${req.method} ${req.originalUrl} - ${duration}ms`);
        } else if (process.env.NODE_ENV === 'development') {
            console.log(`[API] ${req.method} ${req.originalUrl} - ${duration}ms`);
        }

        // Add timing header
        res.setHeader('X-Response-Time', `${duration}ms`);

        return originalEnd.apply(this, args);
    };

    next();
};

export default queryTimingMiddleware;
