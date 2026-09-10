import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
const p = await db.product.findUnique({
  where: { id: 'f990c394-5503-48a6-9832-1c1161745308' },
  select: {
    name: true, description: true, shortDescription: true,
    weight: true, length: true, width: true, height: true,
    price: true, salePrice: true, sku: true, metafields: true,
    categories: { select: { name: true } },
  },
});
console.log(JSON.stringify(p, null, 2));
await db.$disconnect();
