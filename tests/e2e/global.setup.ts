import { test as setup } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import fs from 'fs';

setup('create test database and seed', async () => {
  console.log('--- RUNNING GLOBAL SETUP ---');
  // Nuke existing test DB to avoid constraint issues
  if (fs.existsSync('./test.db')) {
    fs.unlinkSync('./test.db');
  }

  // 1. Run migrations against test.db
  // Explicitly point to the production database for infrastructure testing
  process.env.DATABASE_URL = 'file:./production-data/production.db';
  console.log('Running prisma db push on production.db...');
  execSync('npx cross-env DATABASE_URL="file:./production-data/production.db" prisma db push --accept-data-loss', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: 'file:./production-data/production.db' } });

  // 2. Seed database
  const prisma = new PrismaClient({ datasources: { db: { url: 'file:./production-data/production.db' } } });
  
  // Upsert Roles to avoid unique constraint errors
  const ownerRole = await prisma.role.upsert({ where: { code: 'OWNER' }, update: {}, create: { name: 'Owner', code: 'OWNER' } });
  const salesRole = await prisma.role.upsert({ where: { code: 'SALES' }, update: {}, create: { name: 'Sales', code: 'SALES' } });
  const employeeRole = await prisma.role.upsert({ where: { code: 'EMPLOYEE' }, update: {}, create: { name: 'Employee', code: 'EMPLOYEE' } });
  const clientRole = await prisma.role.upsert({ where: { code: 'CLIENT' }, update: {}, create: { name: 'Client', code: 'CLIENT' } });

  const passwordHash = await bcrypt.hash('TestPassword123!', 10);

  // Seed Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@test.com' },
    update: {},
    create: {
      email: 'owner@test.com',
      passwordHash,
      name: 'Test Owner',
      designation: 'CEO',
      department: 'Management',
      activeRole: 'OWNER',
      userRoles: { create: { roleId: ownerRole.id } }
    }
  });

  // Seed Sales
  const sales = await prisma.user.upsert({
    where: { email: 'sales@test.com' },
    update: {},
    create: {
      email: 'sales@test.com',
      passwordHash,
      name: 'Test Sales',
      designation: 'Sales Executive',
      department: 'Sales',
      activeRole: 'SALES',
      userRoles: { create: { roleId: salesRole.id } }
    }
  });

  // Seed Employee
  const emp = await prisma.user.upsert({
    where: { email: 'emp@test.com' },
    update: {},
    create: {
      email: 'emp@test.com',
      passwordHash,
      name: 'Test Employee',
      designation: 'Developer',
      department: 'Engineering',
      activeRole: 'EMPLOYEE',
      userRoles: { create: { roleId: employeeRole.id } },
      employeeProfile: {
        create: {
          employeeIdCode: 'EMP-TEST-01'
        }
      }
    }
  });

  // Seed Client
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      passwordHash,
      name: 'Test Client User',
      designation: 'Client',
      department: 'External',
      activeRole: 'CLIENT',
      userRoles: { create: { roleId: clientRole.id } },
      createdClients: {
        create: {
          clientNumber: 'CLT-TEST-01',
          companyName: 'Test Client Corp',
          phone: '+1234567890',
          email: 'client@test.com',
        }
      }
    }
  });

  const clientDb = await prisma.client.findFirst({ where: { email: 'client@test.com' } });
  
  // Seed Project and Portal Token
  const project = await prisma.project.upsert({
    where: { projectNumber: 'PRJ-TEST-01' },
    update: {},
    create: {
      projectNumber: 'PRJ-TEST-01',
      name: 'Test Project',
      clientId: clientDb!.id,
      createdById: owner.id,
    }
  });

  await prisma.clientPortalToken.upsert({
    where: { token: 'test-portal-token-123' },
    update: {},
    create: {
      token: 'test-portal-token-123',
      clientId: clientDb!.id,
      projectId: project.id,
      expiresAt: new Date(Date.now() + 86400000)
    }
  });

  await prisma.$disconnect();
  console.log('--- GLOBAL SETUP COMPLETE ---');
});
