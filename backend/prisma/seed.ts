/**
 * KISAN SAHAY - Database Seed Script
 * Creates initial admin users and test data
 * 
 * Run with: npm run prisma:seed
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';
import path from 'path';

// Create Prisma client with LibSQL adapter (same as main app)
function createPrismaClient(): PrismaClient {
    // Path from prisma folder to itself
    const dbPath = path.resolve(__dirname, '../dev.db');
    const adapter = new PrismaLibSql({
        url: `file:${dbPath}`,
    });
    return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

// ============================================
// CONFIGURATION
// ============================================

const SALT_ROUNDS = 12;

const INITIAL_ADMINS = [
    {
        email: 'superadmin@kisansahay.org',
        password: 'Admin@2024',
        name: 'Super Administrator',
        role: 'SUPER_ADMIN' as const,
        district: null,
    },
    {
        email: 'pune.admin@kisansahay.org',
        password: 'Pune@2024',
        name: 'Pune District Admin',
        role: 'DISTRICT_ADMIN' as const,
        district: 'Pune',
    },
    {
        email: 'counselor1@kisansahay.org',
        password: 'Counsel@2024',
        name: 'Ramesh Patil',
        role: 'COUNSELOR' as const,
        district: 'Pune',
    },
];

const SAMPLE_FARMERS = [
    {
        name: 'राजू शिंदे',
        mobile: '9876543210',
        password: 'Farmer@123',
        village: 'शिरूर',
        taluka: 'शिरूर',
        district: 'Pune',
        farmSize: 5.5,
        preferredLang: 'mr' as const,
    },
    {
        name: 'सुनील पाटील',
        mobile: '9876543211',
        password: 'Farmer@123',
        village: 'जुन्नर',
        taluka: 'जुन्नर',
        district: 'Pune',
        farmSize: 3.0,
        preferredLang: 'mr' as const,
    },
    {
        name: 'अनिल जाधव',
        mobile: '9876543212',
        password: 'Farmer@123',
        village: 'बारामती',
        taluka: 'बारामती',
        district: 'Pune',
        farmSize: 8.0,
        preferredLang: 'hi' as const,
    },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function seedAdmins() {
    console.log('🔑 Seeding admin users...');

    for (const admin of INITIAL_ADMINS) {
        const existing = await prisma.adminUser.findUnique({
            where: { email: admin.email },
        });

        if (existing) {
            console.log(`  ⏭️  Admin ${admin.email} already exists`);
            continue;
        }

        const passwordHash = await hashPassword(admin.password);

        await prisma.adminUser.create({
            data: {
                email: admin.email,
                passwordHash,
                name: admin.name,
                role: admin.role,
                district: admin.district,
            },
        });

        console.log(`  ✅ Created admin: ${admin.email} (${admin.role})`);
    }
}

async function seedFarmers() {
    console.log('\n🌾 Seeding sample farmers...');

    for (const farmer of SAMPLE_FARMERS) {
        const existing = await prisma.farmer.findUnique({
            where: { mobile: farmer.mobile },
        });

        if (existing) {
            console.log(`  ⏭️  Farmer ${farmer.mobile} already exists`);
            continue;
        }

        const passwordHash = await hashPassword(farmer.password);

        await prisma.farmer.create({
            data: {
                name: farmer.name,
                mobile: farmer.mobile,
                passwordHash,
                village: farmer.village,
                taluka: farmer.taluka,
                district: farmer.district,
                farmSize: farmer.farmSize,
                preferredLang: farmer.preferredLang,
            },
        });

        console.log(`  ✅ Created farmer: ${farmer.name} (${farmer.mobile})`);
    }
}

async function seedSampleCheckIns() {
    console.log('\n📝 Seeding sample check-ins...');

    const farmers = await prisma.farmer.findMany({ take: 3 });

    if (farmers.length === 0) {
        console.log('  ⚠️  No farmers found, skipping check-ins');
        return;
    }

    const checkInData = [
        {
            cropCondition: 'good',
            loanPressure: 'low',
            sleepQuality: 'good',
            familySupport: 'strong',
            hopeLevel: 8,
            riskScore: 15,
            riskLevel: 'LOW' as const,
            criticalFactors: '[]',
        },
        {
            cropCondition: 'moderate',
            loanPressure: 'medium',
            sleepQuality: 'fair',
            familySupport: 'moderate',
            hopeLevel: 5,
            riskScore: 45,
            riskLevel: 'MODERATE' as const,
            criticalFactors: '["loan_moderate"]',
        },
        {
            cropCondition: 'poor',
            loanPressure: 'high',
            sleepQuality: 'poor',
            familySupport: 'weak',
            hopeLevel: 3,
            riskScore: 75,
            riskLevel: 'HIGH' as const,
            criticalFactors: '["crop_poor", "loan_high", "sleep_poor"]',
        },
    ];

    for (let i = 0; i < Math.min(farmers.length, checkInData.length); i++) {
        const farmer = farmers[i];
        const data = checkInData[i];

        // Check if farmer already has check-ins
        const existingCheckIn = await prisma.checkIn.findFirst({
            where: { farmerId: farmer.id },
        });

        if (existingCheckIn) {
            console.log(`  ⏭️  Farmer ${farmer.name} already has check-ins`);
            continue;
        }

        const checkIn = await prisma.checkIn.create({
            data: {
                farmerId: farmer.id,
                ...data,
            },
        });

        // Create alert for high-risk check-in
        const riskLevel = data.riskLevel as string;
        if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
            await prisma.alert.create({
                data: {
                    farmerId: farmer.id,
                    checkInId: checkIn.id,
                    severity: riskLevel === 'CRITICAL' ? 'critical' : 'high',
                    status: 'pending',
                },
            });
            console.log(`  ⚠️  Created alert for high-risk check-in`);
        }

        console.log(`  ✅ Created check-in for ${farmer.name} (${data.riskLevel})`);
    }
}

async function printCredentials() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 LOGIN CREDENTIALS');
    console.log('='.repeat(60));

    console.log('\n🔐 ADMIN ACCOUNTS:');
    console.log('─'.repeat(40));
    for (const admin of INITIAL_ADMINS) {
        console.log(`  Email:    ${admin.email}`);
        console.log(`  Password: ${admin.password}`);
        console.log(`  Role:     ${admin.role}`);
        console.log('─'.repeat(40));
    }

    console.log('\n🌾 FARMER ACCOUNTS:');
    console.log('─'.repeat(40));
    for (const farmer of SAMPLE_FARMERS) {
        console.log(`  Mobile:   ${farmer.mobile}`);
        console.log(`  Password: ${farmer.password}`);
        console.log(`  Name:     ${farmer.name}`);
        console.log('─'.repeat(40));
    }
    console.log();
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('🚀 Starting KISAN SAHAY Database Seed\n');

    try {
        await seedAdmins();
        await seedFarmers();
        await seedSampleCheckIns();
        await printCredentials();

        console.log('✨ Seed completed successfully!\n');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
