import { Client } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  await client.connect();

  try {
    // Verificar tablas existentes
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log("Tablas existentes:", tables.rows.map(r => r.tablename));

    if (tables.rows.length === 0) {
      console.log("No hay tablas. Ejecuta 'npx prisma db push' primero.");
      return;
    }

    const existingUser = await client.query(
      'SELECT id FROM "User" WHERE email = $1',
      ["admin@estacionamientos.cl"]
    );

    if (existingUser.rows.length > 0) {
      console.log("El usuario admin ya existe");
      return;
    }

    const passwordHash = await bcrypt.hash("admin123", 10);

    await client.query(
      `INSERT INTO "User" (id, email, password_hash, role, name, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'SUPER_ADMIN', 'Admin Principal', true, NOW(), NOW())`,
      ["admin@estacionamientos.cl", passwordHash]
    );

    console.log("Usuario admin creado exitosamente");
    console.log("Email: admin@estacionamientos.cl");
    console.log("Password: admin123");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
