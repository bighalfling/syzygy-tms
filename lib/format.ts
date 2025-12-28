export function formatClientAddress(c: {
  street: string;
  city: string;
  zip: string;
  country: string;
}) {
  const parts = [
    (c.street || "").trim(),
    `${(c.zip || "").trim()} ${(c.city || "").trim()}`.trim(),
    (c.country || "").trim(),
  ].filter(Boolean);

  return parts.join(", ");
}
