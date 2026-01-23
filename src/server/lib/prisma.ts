/**
 * Shared Prisma client instance
 * Uses singleton pattern to prevent multiple instances
 */

import { PrismaClient } from '@prisma/client';

declare global {
  var __prismaSingletonForHotReload: PrismaClient | undefined;
}

global.__prismaSingletonForHotReload = global.__prismaSingletonForHotReload || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
export const prisma = global.__prismaSingletonForHotReload;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
