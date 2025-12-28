import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Company directory for orders and invoices.
          </p>
        </div>

        <Link
          href="/clients/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          + New client
        </Link>
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Country</th>
                <th className="text-left px-4 py-3 font-medium">VAT</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No clients yet. Create the first one.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/clients/${c.id}`}
                        className="underline underline-offset-4 hover:opacity-80"
                      >
                        {c.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {(c.street || c.city || c.country) ? `${c.street ?? ""} ${c.city ?? ""}`.trim() : ""}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">{c.country || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.vatId || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/clients/${c.id}/edit`}
                        className="underline underline-offset-4 hover:opacity-80"
                      >
                        Edit
                      </Link>
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
