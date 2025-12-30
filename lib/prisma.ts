// lib/prisma.ts
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const pool = new Pool({ connectionString })

const adapter = new PrismaPg(pool)

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, 
    log: process.env.NODE_ENV === 'development' ? [ 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const db = prisma;