"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getRecentTransactions(parkingId: string) {
  const session = await auth();
  if (!session?.user) return [];

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        vehicle: { parking_id: parkingId },
      },
      include: {
        vehicle: true,
        creator: { select: { name: true } },
      },
      orderBy: { paid_at: "desc" },
      take: 50,
    });

    return transactions;
  } catch {
    return [];
  }
}

export async function getTodayStats(parkingId: string) {
  const session = await auth();
  if (!session?.user) return null;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        vehicle: { parking_id: parkingId },
        paid_at: { gte: today },
      },
    });

    const totalIncome = transactions.reduce((sum, t) => sum + t.amount_clp, 0);
    const totalVehicles = transactions.length;

    return { totalIncome, totalVehicles };
  } catch {
    return null;
  }
}
