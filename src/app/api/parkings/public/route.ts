import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const parkings = await prisma.parkingFacility.findMany({
      where: { is_public: true, is_active: true },
      include: { pricing_config: true },
      orderBy: { created_at: "desc" },
    });

    const parkingsWithAvailability = await Promise.all(
      parkings.map(async (parking) => {
        const parkedCount = await prisma.vehicle.count({
          where: {
            parking_id: parking.id,
            status: "PARKED",
          },
        });

        const availableSpots = parking.total_spots - parkedCount;

        const pricing = parking.pricing_config;
        const prices: { label: string; price: number; key: string }[] = [];
        if (pricing) {
          const entries: [string, string, number | null][] = [
            ["price_per_minute", "min", pricing.price_per_minute],
            ["price_per_hour", "hora", pricing.price_per_hour],
            ["price_per_day", "día", pricing.price_per_day],
            ["price_per_month", "mes", pricing.price_per_month],
          ];
          for (const [key, label, value] of entries) {
            if (value !== null && value !== undefined && value > 0) {
              prices.push({ label, price: value, key });
            }
          }
        }

        const lowest = prices.length > 0 ? prices.reduce((a, b) => (a.price < b.price ? a : b)) : null;

        return {
          id: parking.id,
          name: parking.name,
          address: parking.address,
          description: parking.description,
          total_spots: parking.total_spots,
          lat: parking.latitude ?? 0,
          lng: parking.longitude ?? 0,
          availableSpots,
          pricing,
          lowestPrice: lowest,
          opensAt: parking.opens_at,
          closesAt: parking.closes_at,
        };
      })
    );

    return NextResponse.json(parkingsWithAvailability);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
