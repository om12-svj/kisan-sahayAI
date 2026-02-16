import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { env } from './config';
import {
    errorHandler,
    notFoundHandler,
    requestIdMiddleware
} from './shared/middleware';
import { rateLimit } from './shared/middleware/rate-limit.middleware';

// Import routes
import { authRoutes } from './modules/auth';
import { farmerRoutes } from './modules/farmer';
import { checkInRoutes } from './modules/checkin';
import { adminRoutes } from './modules/admin';

// Create Express app
const app: Application = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Security headers
app.use(helmet({
    contentSecurityPolicy: env.isProduction ? undefined : false,
}));

// CORS
app.use(cors({
    origin: env.isDevelopment ? '*' : env.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// ============================================
// GENERAL MIDDLEWARE
// ============================================

// Request ID
app.use(requestIdMiddleware);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Compression
app.use(compression());

// Logging
if (env.isDevelopment) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Global rate limiting
app.use(rateLimit());

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
    });
});

// ============================================
// API ROUTES
// ============================================

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/farmers`, farmerRoutes);
app.use(`${API_PREFIX}/checkins`, checkInRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// API documentation endpoint
app.get(`${API_PREFIX}`, (_req: Request, res: Response) => {
    res.json({
        name: 'KISAN SAHAY API',
        version: '1.0.0',
        description: 'Farmer Mental Health Support System Backend',
        endpoints: {
            auth: {
                'POST /auth/register': 'Register a new farmer',
                'POST /auth/login': 'Login with mobile and password',
                'POST /auth/otp/send': 'Send OTP via SMS or WhatsApp',
                'POST /auth/otp/verify': 'Verify OTP and login',
                'POST /auth/refresh': 'Refresh access token',
                'POST /auth/logout': 'Logout and revoke token',
                'GET /auth/me': 'Get current user info',
            },
            farmers: {
                'GET /farmers/me': 'Get farmer profile',
                'PATCH /farmers/me': 'Update farmer profile',
                'GET /farmers/me/checkins': 'Get check-in history',
                'GET /farmers/me/stats': 'Get statistics',
            },
            checkins: {
                'POST /checkins': 'Submit new check-in',
                'GET /checkins/:id': 'Get check-in by ID',
            },
            admin: {
                'POST /admin/login': 'Admin login',
                'GET /admin/me': 'Get current admin info',
                'GET /admin/dashboard': 'Get dashboard statistics',
                'GET /admin/farmers': 'List farmers with filters',
                'GET /admin/farmers/:id': 'Get farmer details',
                'GET /admin/alerts': 'List alerts with filters',
                'PATCH /admin/alerts/:id': 'Update alert status',
                'GET /admin/counselors': 'List counselors',
                'POST /admin/counselors/assign': 'Assign counselor to farmer',
                'GET /admin/checkins': 'List check-ins with filters',
                'GET /admin/analytics/trends': 'Get risk trends',
                'POST /admin/notifications/send': 'Send reminder notification',
                'POST /admin/register': 'Register new admin (Super Admin only)',
            },
        },
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
