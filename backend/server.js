import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import { notFound, errorHandler } from './Middleware/errorMiddleware.js';
import queryTimingMiddleware from './Middleware/queryTimingMiddleware.js';
import colors from 'colors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import payRoutes from './routes/payRoutes.js';
import classRoutes from './routes/classRoutes.js';
import typeRoutes from './routes/typeRoutes.js';
import schoolRoutes from './routes/schoolRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import notFoundRequestRoutes from './routes/notFoundRequestRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

dotenv.config();

connectDB();

const app = express();

// Enable CORS for cross-origin requests from both frontends
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',  // Next.js customer site
    process.env.ADMIN_URL || 'http://localhost:3001',     // React Admin
    'https://www.allschooluniform.com',                   // Production Next.js
    'https://allschooluniform.com',                       // Production Next.js (apex)
    'https://admin.allschooluniform.com',                 // Production React Admin
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in development, tighten in production if needed
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Compress all HTTP responses (gzip) - reduces payload by 70-90%
app.use(compression());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/pay', payRoutes);
app.use('/api/types', typeRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/requests', notFoundRequestRoutes);
app.use('/api/search', searchRoutes);

// SEO: Prevent indexing of Admin/API domain
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /');
});

const __dirname = path.resolve();

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use(
    '/uploads/products',
    express.static(path.join(__dirname, '/uploads/products'))
);
app.use(
    '/uploads/schools',
    express.static(path.join(__dirname, '/uploads/schools'))
);

if (process.env.NODE_ENV === 'production') {
    // Serve React Admin static files - BUT don't serve index.html automatically
    app.use(express.static(path.join(__dirname, '/frontend/build'), { index: false }));

    // Helper function to serve React Admin
    const serveReactAdmin = (req, res) => {
        res.sendFile(
            path.resolve(__dirname, 'frontend', 'build', 'index.html')
        );
    };

    // Next.js URL - configurable for local testing
    const NEXTJS_URL = process.env.NEXTJS_URL || 'https://www.allschooluniform.com';

    // ADMIN ROUTES: Serve React Admin for /admin/* routes
    app.get('/admin', serveReactAdmin);
    app.get('/admin/*', serveReactAdmin);

    // AUTH ROUTES: Required for admin login flow
    app.get('/login', serveReactAdmin);
    app.get('/register', serveReactAdmin);
    app.get('/otp', serveReactAdmin);
    app.get('/forgotpassword', serveReactAdmin);
    app.get('/resetpassword', serveReactAdmin);

    // ADMIN-SPECIFIC PAGES: Admin functionality outside /admin/* prefix
    app.get('/newcustomerbyadmin', serveReactAdmin);

    // ROOT: Redirect to Next.js customer site
    app.get('/', (req, res) => {
        res.redirect(NEXTJS_URL);
    });

    // CATCH-ALL for unmatched routes: Redirect to Next.js
    // This ensures any old customer URLs redirect properly
    app.get('*', (req, res, next) => {
        // Don't redirect API routes or uploads
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
            return next();
        }
        res.redirect(NEXTJS_URL + req.path);
    });
} else {
    app.get('/', (req, res) => {
        res.send('API is running');
    });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
            .bold
    )
);
