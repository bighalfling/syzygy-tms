"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const DriverCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  nationality: z.string().trim().max(60).optional().or(z.literal("")),
  licenseNumber: z.string().trim().max(60).optional().or(z.literal("")),
  licenseExpiry: z.string().optional().or(z.literal("")), // ISO string from input[type=date]
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function createDriver(formData: FormData) {
  const raw = {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    nationality: String(formData.get("nationality") ?? "").trim(),
    licenseNumber: String(formData.get("licenseNumber") ?? "").trim(),
    licenseExpiry: String(formData.get("licenseExpiry") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };

  const parsed = DriverCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const v = parsed.data;

  await prisma.driver.create({
    data: {
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone || null,
      email: v.email || null,
      nationality: v.nationality || null,
      licenseNumber: v.licenseNumber || null,
      licenseExpiry: v.licenseExpiry ? new Date(v.licenseExpiry) : null,
      notes: v.notes || null,
      status: "ACTIVE",
    },
  });

  revalidatePath("/drivers");
  return { ok: true as const };
}

export async function deleteDriver(id: string) {
  if (!id) return { ok: false as const, error: "Missing id" };

  // если позже будут связи (trip/order), тут можно добавить проверки
  await prisma.driver.delete({ where: { id } });

  revalidatePath("/drivers");
  return { ok: true as const };
}
