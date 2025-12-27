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

// Enable CORS for cross-origin requests
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
    app.use(express.static(path.join(__dirname, '/frontend/build')));

    app.get('*', (req, res) => {
        res.sendFile(
            path.resolve(__dirname, 'frontend', 'build', 'index.html')
        );
    });
} else {
    app.get('/', (req, res) => {
        res.send('API is running');
    });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
            .bold
    )
);
