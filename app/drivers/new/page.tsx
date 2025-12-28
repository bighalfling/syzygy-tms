import Link from "next/link";
import AddDriverForm from "../ui/AddDriverForm";

export const dynamic = "force-dynamic";

export default function NewDriverPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New driver</h1>
          <p className="text-sm text-muted-foreground">
            Add driver contact and license details.
          </p>
        </div>

        <Link
          href="/drivers"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back
        </Link>
      </div>

      {/* Form card */}
      <div className="rounded-xl border bg-background p-6 md:p-8">
        <AddDriverForm />
      </div>
    </div>
  );
}
