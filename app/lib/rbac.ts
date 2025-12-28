export function canAccessInvoices(role?: string | null) {
  return role === "ADMIN" || role === "ACCOUNTING";
}

export function canEditTrips(role?: string | null) {
  return role === "ADMIN" || role === "DISPATCHER";
}

export function canManageOrders(role?: string | null) {
  return role === "ADMIN" || role === "DISPATCHER";
}

export function canManageTrips(role?: string | null) {
  return role === "ADMIN" || role === "DISPATCHER";
}
