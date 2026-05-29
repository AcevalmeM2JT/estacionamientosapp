import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parkingId = searchParams.get("parkingId");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        try {
          if (parkingId) {
            const [parkedCount, totalSpots] = await Promise.all([
              prisma.vehicle.count({
                where: { parking_id: parkingId, status: "PARKED" },
              }),
              prisma.parkingFacility.findUnique({
                where: { id: parkingId },
                select: { total_spots: true, name: true },
              }),
            ]);

            if (totalSpots) {
              send("availability", {
                parkingId,
                parkedCount,
                availableSpots: totalSpots.total_spots - parkedCount,
                totalSpots: totalSpots.total_spots,
              });
            }

            const activeVehicles = await prisma.vehicle.findMany({
              where: { parking_id: parkingId, status: "PARKED" },
              select: {
                id: true,
                license_plate: true,
                entry_time: true,
                is_subscriber: true,
              },
              orderBy: { entry_time: "desc" },
            });

            send("vehicles", { vehicles: activeVehicles });
          } else {
            const parkings = await prisma.parkingFacility.findMany({
              where: { is_public: true, is_active: true },
              select: { id: true, total_spots: true, name: true },
            });

            const availability = await Promise.all(
              parkings.map(async (p) => {
                const parkedCount = await prisma.vehicle.count({
                  where: { parking_id: p.id, status: "PARKED" },
                });
                return { id: p.id, name: p.name, totalSpots: p.total_spots, availableSpots: p.total_spots - parkedCount };
              })
            );

            send("marketplace", { availability });
          }
        } catch {
          send("error", { message: "Error fetching data" });
        }
      };

      await poll();
      const interval = setInterval(poll, 10000);

      send("connected", { parkingId: parkingId || "marketplace" });

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
