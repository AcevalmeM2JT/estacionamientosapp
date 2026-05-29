import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@estacionamientos.cl" },
    update: {},
    create: {
      email: "admin@estacionamientos.cl",
      password_hash: passwordHash,
      role: "SUPER_ADMIN",
      name: "Admin Principal",
      is_active: true,
    },
  });

  console.log("Admin listo: admin@estacionamientos.cl / admin123");

  const existingParking = await prisma.parkingFacility.findFirst();
  if (existingParking) {
    console.log("Ya hay datos de ejemplo, omitiendo creación");
    return;
  }

  const parking = await prisma.parkingFacility.create({
    data: {
      owner_id: admin.id,
      name: "Estacionamiento Centro",
      address: "Av. Providencia 1234, Santiago",
      latitude: -33.4265,
      longitude: -70.6065,
      description: "Estacionamiento moderno en pleno centro. Cámaras de seguridad 24/7.",
      total_spots: 50,
      reserved_spots: 5,
      is_public: true,
    },
  });

  console.log("Parking creado:", parking.name);

  await prisma.pricingConfig.create({
    data: {
      parking_id: parking.id,
      price_per_minute: 50,
      price_per_hour: 2500,
      price_per_day: 15000,
      price_per_month: 120000,
      billing_mode: "HOUR",
    },
  });

  const workerHash = await bcrypt.hash("trabajador123", 10);
  const worker = await prisma.user.create({
    data: {
      email: "trabajador@estacionamientos.cl",
      password_hash: workerHash,
      role: "WORKER",
      name: "Carlos Muñoz",
      is_active: true,
    },
  });

  await prisma.parkingWorker.create({
    data: {
      parking_id: parking.id,
      user_id: worker.id,
    },
  });

  console.log("Trabajador creado: trabajador@estacionamientos.cl / trabajador123");

  await prisma.subscriber.create({
    data: {
      parking_id: parking.id,
      license_plate: "ABCD12",
      owner_name: "María González",
      owner_phone: "+56912345678",
      monthly_fee_clp: 80000,
      start_date: new Date("2026-01-01"),
      end_date: new Date("2026-12-31"),
      is_active: true,
    },
  });

  await prisma.subscriber.create({
    data: {
      parking_id: parking.id,
      license_plate: "EFGH34",
      owner_name: "Pedro Soto",
      monthly_fee_clp: 60000,
      start_date: new Date("2026-03-01"),
      end_date: new Date("2026-09-30"),
      is_active: true,
    },
  });

  console.log("2 abonados creados");

  await prisma.vehicle.create({
    data: {
      parking_id: parking.id,
      license_plate: "XYZW56",
      entry_time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  console.log("Vehículo de prueba estacionado");
  console.log("✅ Seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
