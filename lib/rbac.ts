export const Role = {
  ADMIN: "ADMIN",
  DISPATCHER: "DISPATCHER",
  ACCOUNTING: "ACCOUNTING",
} as const;

export type RoleType = keyof typeof Role;

export function canAccessInvoices(role?: string) {
  return role === "ADMIN" || role === "ACCOUNTING";
}

export function canEditTrips(role?: string) {
  return role === "ADMIN" || role === "DISPATCHER";
}
