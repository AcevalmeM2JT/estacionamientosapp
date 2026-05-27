import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Receipt from "@/components/receipt";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id },
    include: {
      parking: true,
      transaction: true,
    },
  });

  if (!vehicle) notFound();

  return (
    <div>
      <div className="mb-6 print:hidden">
        <Link
          href="/dashboard/operations"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Volver a operaciones
        </Link>
      </div>

      <Receipt
        data={{
          receiptNumber: vehicle.transaction?.receipt_number ?? null,
          parkingName: vehicle.parking.name,
          parkingAddress: vehicle.parking.address,
          licensePlate: vehicle.license_plate,
          entryTime: vehicle.entry_time,
          exitTime: vehicle.exit_time,
          durationMinutes: vehicle.transaction?.duration_minutes ?? null,
          amountClp: vehicle.transaction?.amount_clp ?? null,
          paymentMethod: vehicle.transaction?.payment_method ?? null,
          isSubscriber: vehicle.is_subscriber,
        }}
      />
    </div>
  );
}
