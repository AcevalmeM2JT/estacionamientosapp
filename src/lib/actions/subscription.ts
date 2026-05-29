"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface TierInfo {
  tier: number;
  label: string;
  maxSpots: number | null;
  pricePerMonth: number;
  isFree: boolean;
}

export interface TrialInfo {
  isInTrial: boolean;
  endsAt: Date | null;
  daysLeft: number;
}

export interface ParkingSummary {
  parkingCount: number;
  totalSpots: number;
  spotsPerParking: { name: string; spots: number }[];
}

const TIERS: TierInfo[] = [
  { tier: 0, label: "Gratis", maxSpots: 1, pricePerMonth: 0, isFree: true },
  { tier: 1, label: "Básico", maxSpots: 10, pricePerMonth: 9990, isFree: false },
  { tier: 2, label: "Profesional", maxSpots: 50, pricePerMonth: 19990, isFree: false },
  { tier: 3, label: "Empresarial", maxSpots: null, pricePerMonth: 39990, isFree: false },
];

export async function getAllTiers(): Promise<TierInfo[]> {
  return TIERS;
}

export async function getTrialStatus(): Promise<TrialInfo> {
  const session = await auth();
  if (!session?.user) return { isInTrial: false, endsAt: null, daysLeft: 0 };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { trial_ends_at: true },
  });

  if (!user?.trial_ends_at) return { isInTrial: false, endsAt: null, daysLeft: 0 };

  const now = new Date();
  const isInTrial = now < user.trial_ends_at;
  const daysLeft = isInTrial ? Math.ceil((user.trial_ends_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return { isInTrial, endsAt: user.trial_ends_at, daysLeft };
}

export async function getParkingSummary(): Promise<ParkingSummary> {
  const session = await auth();
  if (!session?.user) return { parkingCount: 0, totalSpots: 0, spotsPerParking: [] };

  const parkings = await prisma.parkingFacility.findMany({
    where: { owner_id: session.user.id },
    select: { name: true, total_spots: true },
  });

  return {
    parkingCount: parkings.length,
    totalSpots: parkings.reduce((sum, p) => sum + p.total_spots, 0),
    spotsPerParking: parkings.map(p => ({ name: p.name, spots: p.total_spots })),
  };
}

export async function getTotalSpots(): Promise<number> {
  const summary = await getParkingSummary();
  return summary.totalSpots;
}

export async function getRequiredTier(): Promise<TierInfo | null> {
  const spots = await getTotalSpots();

  for (const tier of TIERS) {
    if (tier.maxSpots === null || spots <= tier.maxSpots) {
      return tier;
    }
  }

  return TIERS[TIERS.length - 1];
}

export async function getActiveSubscription() {
  const session = await auth();
  if (!session?.user) return null;

  return prisma.subscription.findFirst({
    where: {
      user_id: session.user.id,
      status: "active",
      end_date: { gte: new Date() },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function checkSubscriptionActive(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  if (session.user.role === "SUPER_ADMIN") return true;

  const trial = await getTrialStatus();
  if (trial.isInTrial) return true;

  const tier = await getRequiredTier();
  if (!tier) return false;

  if (tier.isFree) return true;

  const sub = await getActiveSubscription();
  return sub !== null;
}

export async function activateSubscription(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  try {
    const tier = await getRequiredTier();
    if (!tier) return { error: "No se pudo determinar el plan" };
    if (tier.isFree) return { error: "El plan gratis no requiere activación" };

    const months = parseInt(formData.get("months") as string) || 1;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    await prisma.subscription.create({
      data: {
        user_id: session.user.id,
        plan_type: `tier${tier.tier}`,
        status: "active",
        start_date: startDate,
        end_date: endDate,
        amount_clp: tier.pricePerMonth * months,
      },
    });

    revalidatePath("/dashboard/subscription");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/operations");
    return { success: true };
  } catch {
    return { error: "Error al activar suscripción" };
  }
}

export async function getSubscriptionHistory() {
  const session = await auth();
  if (!session?.user) return [];

  return prisma.subscription.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "desc" },
  });
}
