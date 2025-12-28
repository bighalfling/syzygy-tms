import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteDriverButton from "./ui/DeleteDriverButton";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const drivers = await prisma.driver.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Drivers</h1>
          <p className="text-sm text-muted-foreground">
            Manage drivers, contacts, and license details.
          </p>
        </div>

        <Link
          href="/drivers/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          + New driver
        </Link>
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Nationality</th>
                <th className="px-4 py-3 text-left font-medium">License</th>
                <th className="px-4 py-3 text-left font-medium">Expiry</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No drivers yet. Click “+ New driver”.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        <Link
                          href={`/drivers/${d.id}`}
                          className="underline underline-offset-4 hover:opacity-80"
                        >
                          {d.firstName} {d.lastName}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground">{d.status}</div>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">{d.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.nationality ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.licenseNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.licenseExpiry ? new Date(d.licenseExpiry).toISOString().slice(0, 10) : "—"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <DeleteDriverButton id={d.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
