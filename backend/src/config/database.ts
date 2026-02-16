import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

/**
 * Create a Prisma client with LibSQL adapter for SQLite
 * This is required for Prisma 7+
 */
function prismaClientSingleton(): PrismaClient {
    // Get absolute path to database file
    const dbPath = path.resolve(__dirname, '../../prisma/dev.db');

    // Create adapter with config object
    const adapter = new PrismaLibSql({
        url: `file:${dbPath}`,
    });

    // Return PrismaClient with adapter
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });
}

// Prevent multiple instances during development hot-reload
declare const globalThis: {
    prismaGlobal: PrismaClient;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}

/**
 * Connect to database
 */
export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        console.log('📦 Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect();
    console.log('📦 Database disconnected');
}
