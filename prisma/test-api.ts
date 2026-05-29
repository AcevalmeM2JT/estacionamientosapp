import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  const parkings = await p.parkingFacility.findMany({
    where: { is_public: true, is_active: true },
    include: { pricing_config: true },
    orderBy: { created_at: "desc" },
  });

  console.log("Parkings found:", parkings.length);

  for (const parking of parkings) {
    console.log("Parking:", parking.id, parking.name);
    console.log("is_public:", parking.is_public, "is_active:", parking.is_active);
    console.log("Pricing config:", parking.pricing_config?.price_per_hour);
    
    const parkedCount = await p.vehicle.count({
      where: {
        parking_id: parking.id,
        status: "PARKED",
      },
    });
    console.log("Parked count:", parkedCount);
  }
}

main().finally(() => p.$disconnect());
