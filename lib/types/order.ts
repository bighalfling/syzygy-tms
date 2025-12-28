export type OrderStatus = "NEW" | "PLANNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: string;
  orderRef: string;
  clientName: string;
  pickupAddress: string;
  pickupDateTime: string;
  deliveryAddress: string;
  deliveryDateTime: string;
  status: OrderStatus;
  vehicle: string;
  driver: string;
  price: string;
  notes: string;
}
