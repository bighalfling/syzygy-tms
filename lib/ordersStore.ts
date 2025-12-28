import { Order } from "@/lib/types/order";

const KEY = "tms_orders_v1";

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(orders));
}
