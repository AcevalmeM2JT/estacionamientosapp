"use client";

interface ReceiptData {
  receiptNumber: string | null;
  parkingName: string;
  parkingAddress: string;
  licensePlate: string;
  entryTime: Date;
  exitTime: Date | null;
  durationMinutes: number | null;
  amountClp: number | null;
  paymentMethod: string | null;
  isSubscriber: boolean;
}

export default function Receipt({ data }: { data: ReceiptData }) {
  function formatCLP(amount: number) {
    return `$${amount.toLocaleString("es-CL")}`;
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  }

  function methodLabel(method: string) {
    const labels: Record<string, string> = {
      CASH: "Efectivo",
      TRANSFER: "Transferencia",
      CARD: "Tarjeta",
    };
    return labels[method] || method;
  }

  return (
    <div>
      <div
        id="receipt-content"
        className="bg-white border border-gray-300 rounded-lg p-8 max-w-md mx-auto print:border-none print:shadow-none print:rounded-none print:p-4"
      >
        <div className="text-center border-b border-gray-300 pb-4 mb-4 print:border-gray-400">
          <h2 className="text-xl font-bold text-gray-900">EstacionamientosApp</h2>
          <p className="text-xs text-gray-500">Comprobante de pago</p>
        </div>

        {data.receiptNumber && (
          <div className="text-center mb-4">
            <p className="text-xs text-gray-500">N° {data.receiptNumber}</p>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="border-b border-dashed border-gray-200 pb-2 mb-2 print:border-gray-400">
            <p className="font-semibold text-gray-900">{data.parkingName}</p>
            <p className="text-gray-500 text-xs">{data.parkingAddress}</p>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Patente</span>
            <span className="font-semibold text-gray-900">{data.licensePlate}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Ingreso</span>
            <span className="text-gray-900">
              {formatDate(data.entryTime)} {formatTime(data.entryTime)}
            </span>
          </div>

          {data.exitTime && (
            <div className="flex justify-between">
              <span className="text-gray-500">Salida</span>
              <span className="text-gray-900">
                {formatDate(data.exitTime)} {formatTime(data.exitTime)}
              </span>
            </div>
          )}

          {data.durationMinutes !== null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Duración</span>
              <span className="text-gray-900">{formatDuration(data.durationMinutes)}</span>
            </div>
          )}

          {data.isSubscriber ? (
            <div className="border-t border-gray-300 pt-2 mt-2 print:border-gray-400">
              <div className="flex justify-between">
                <span className="text-gray-500">Cargo</span>
                <span className="font-semibold text-green-600">Sin cargo (Abonado)</span>
              </div>
            </div>
          ) : data.amountClp !== null && (
            <div className="border-t border-gray-300 pt-2 mt-2 print:border-gray-400">
              <div className="flex justify-between text-base">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">{formatCLP(data.amountClp)}</span>
              </div>
              {data.paymentMethod && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500">Método de pago</span>
                  <span className="text-gray-700">{methodLabel(data.paymentMethod)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-6 pt-4 border-t border-gray-300 print:border-gray-400">
          <p className="text-xs text-gray-400">
            {formatDate(new Date())} - Chile
          </p>
          <p className="text-xs text-gray-400 mt-1">Gracias por preferirnos</p>
        </div>
      </div>

      <div className="text-center mt-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          Imprimir comprobante
        </button>
      </div>

      <style>{`
        @media print {
          @page { margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
