"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getDashboardStats(userId: string) {
  try {
    const parkings = await prisma.parkingFacility.findMany({
      where: { owner_id: userId },
    });

    const parkingIds = parkings.map((p) => p.id);
    if (parkingIds.length === 0) {
      return { totalParkings: 0, parkings: [], totalSpots: 0, parkedCount: 0, incomeToday: 0, entriesToday: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [parkedCount, todayEntries, todayTransactions] = await Promise.all([
      prisma.vehicle.count({
        where: { parking_id: { in: parkingIds }, status: "PARKED" },
      }),
      prisma.vehicle.count({
        where: { parking_id: { in: parkingIds }, entry_time: { gte: today } },
      }),
      prisma.transaction.aggregate({
        where: {
          vehicle: { parking_id: { in: parkingIds } },
          paid_at: { gte: today },
        },
        _sum: { amount_clp: true },
      }),
    ]);

    const totalSpots = parkings.reduce((sum, p) => sum + p.total_spots, 0);

    return {
      totalParkings: parkings.length,
      parkings,
      totalSpots,
      parkedCount,
      incomeToday: todayTransactions._sum.amount_clp ?? 0,
      entriesToday: todayEntries,
    };
  } catch {
    return null;
  }
}

export async function getWorkerStats(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [entriesToday, recentEntries, todayTransactions] = await Promise.all([
      prisma.vehicle.count({
        where: { registered_by: userId, entry_time: { gte: today } },
      }),
      prisma.vehicle.findMany({
        where: { registered_by: userId },
        orderBy: { entry_time: "desc" },
        take: 10,
        include: { parking: { select: { name: true } } },
      }),
      prisma.transaction.aggregate({
        where: {
          vehicle: { registered_by: userId },
          paid_at: { gte: today },
        },
        _sum: { amount_clp: true },
      }),
    ]);

    return {
      entriesToday,
      recentEntries,
      incomeToday: todayTransactions._sum.amount_clp ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getRecentActivity(userId: string) {
  try {
    const parkings = await prisma.parkingFacility.findMany({
      where: { owner_id: userId },
      select: { id: true },
    });

    const parkingIds = parkings.map((p) => p.id);
    if (parkingIds.length === 0) return [];

    const vehicles = await prisma.vehicle.findMany({
      where: { parking_id: { in: parkingIds } },
      orderBy: { entry_time: "desc" },
      take: 10,
    });

    return vehicles;
  } catch {
    return [];
  }
}
