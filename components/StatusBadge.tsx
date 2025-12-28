import { OrderStatus } from "@/lib/types/order";

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  NEW: { label: "New", bg: "bg-gray-100", text: "text-gray-700" },
  PLANNED: { label: "Planned", bg: "bg-blue-100", text: "text-blue-700" },
  IN_TRANSIT: { label: "In Transit", bg: "bg-orange-100", text: "text-orange-700" },
  DELIVERED: { label: "Delivered", bg: "bg-green-100", text: "text-green-700" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-100", text: "text-red-700" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const c = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
