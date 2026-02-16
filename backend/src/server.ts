import app from './app';
import { env, connectDatabase, disconnectDatabase } from './config';

// ============================================
// SERVER STARTUP
// ============================================

async function startServer(): Promise<void> {
    try {
        // Connect to database
        await connectDatabase();

        // Start HTTP server
        const server = app.listen(env.PORT, () => {
            console.log(`
┌─────────────────────────────────────────────────────┐
│                                                     │
│   🌾 KISAN SAHAY Backend Server                     │
│                                                     │
│   Status:      Running                              │
│   Environment: ${env.NODE_ENV.padEnd(20)}           │
│   Port:        ${String(env.PORT).padEnd(20)}       │
│   API URL:     http://localhost:${env.PORT}/api/v1  │
│                                                     │
└─────────────────────────────────────────────────────┘
      `);
        });

        // Graceful shutdown handlers
        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                console.log('HTTP server closed');

                await disconnectDatabase();

                console.log('Shutdown complete');
                process.exit(0);
            });

            // Force exit after 10 seconds
            setTimeout(() => {
                console.error('Forcing shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the server
startServer();
