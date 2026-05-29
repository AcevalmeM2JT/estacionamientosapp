import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  const c = await p.parkingFacility.count();
  console.log("Parkings count:", c);
}
main().finally(() => p.$disconnect());
