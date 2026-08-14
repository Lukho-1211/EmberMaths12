import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_PASSWORD, SEED_USERS } from "../src/lib/mock/seed";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  const pool = new Pool({ connectionString: url });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  try {
    for (const user of SEED_USERS) {
      await prisma.user.upsert({
        where: { email: user.email.toLowerCase() },
        update: {
          name: user.name,
          passwordHash,
          role: user.role,
          province: user.province ?? null,
          municipality: user.municipality ?? null,
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email.toLowerCase(),
          passwordHash,
          role: user.role,
          province: user.province ?? null,
          municipality: user.municipality ?? null,
          createdAt: new Date(user.createdAt),
        },
      });
    }
    console.log(`Seeded ${SEED_USERS.length} users (password: ${DEMO_PASSWORD}).`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
