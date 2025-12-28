"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createOrderAction } from "./actions";

type ClientOption = {
  id: string;
  name: string;
  country: string;
  vatId: string | null;
};

type OrderFormData = {
  orderRef: string;
  clientId: string;
  pickupAddress: string;
  pickupDateTime?: string;
  deliveryAddress: string;
  deliveryDateTime?: string;
  price?: string;
  vehicle?: string;
  driver?: string;
  notes?: string;
};

export default function NewOrderPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    defaultValues: {
      orderRef: "",
      clientId: "",
      pickupAddress: "",
      pickupDateTime: "",
      deliveryAddress: "",
      deliveryDateTime: "",
      price: "",
      vehicle: "",
      driver: "",
      notes: "",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/clients", { cache: "no-store" });
        const data = await res.json();

        const sorted = (Array.isArray(data) ? data : []).sort((a, b) =>
          String(a.name).localeCompare(String(b.name))
        );

        setClients(sorted);
        if (sorted.length > 0) setValue("clientId", sorted[0].id);
      } finally {
        setClientsLoading(false);
      }
    })();
  }, [setValue]);

  const onSubmit = async (data: OrderFormData) => {
    try {
      await createOrderAction(data);
      router.push("/orders");
    } catch (e: any) {
      console.error(e);
      alert("Failed to create order: " + (e?.message ?? String(e)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" onClick={() => router.push("/orders")} className="-ml-3">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Order</h1>
            <p className="text-sm text-muted-foreground">Fill in the details and create an order.</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-xl border bg-background p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderRef">
                Order Reference <span className="text-red-500">*</span>
              </Label>
              <Input
                id="orderRef"
                {...register("orderRef", { required: "Order reference is required" })}
                placeholder="e.g. ORD-123456"
                className={errors.orderRef ? "border-red-500" : ""}
              />
              {errors.orderRef && <p className="text-sm text-red-500">{errors.orderRef.message}</p>}
            </div>

            {/* Client select */}
            <div className="space-y-2">
              <Label htmlFor="clientId">
                Client <span className="text-red-500">*</span>
              </Label>

              <select
                id="clientId"
                {...register("clientId", { required: "Client is required" })}
                className={`w-full rounded-md border px-3 py-2 text-sm bg-background ${
                  errors.clientId ? "border-red-500" : "border-input"
                }`}
                disabled={clientsLoading}
              >
                {clientsLoading ? (
                  <option value="">Loading clients…</option>
                ) : clients.length === 0 ? (
                  <option value="">No clients found — create one first</option>
                ) : (
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.country ? ` (${c.country})` : ""}
                      {c.vatId ? ` — VAT: ${c.vatId}` : ""}
                    </option>
                  ))
                )}
              </select>

              {errors.clientId && <p className="text-sm text-red-500">{errors.clientId.message}</p>}

              {!clientsLoading && clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Go to{" "}
                  <Link href="/clients" className="underline underline-offset-4">
                    Clients
                  </Link>{" "}
                  and add at least one client first.
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupAddress">
              Pickup Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pickupAddress"
              {...register("pickupAddress", { required: "Pickup address is required" })}
              placeholder="e.g. BTS"
              className={errors.pickupAddress ? "border-red-500" : ""}
            />
            {errors.pickupAddress && <p className="text-sm text-red-500">{errors.pickupAddress.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pickupDateTime">Pickup Date & Time</Label>
              <Input id="pickupDateTime" type="datetime-local" {...register("pickupDateTime")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDateTime">Delivery Date & Time</Label>
              <Input id="deliveryDateTime" type="datetime-local" {...register("deliveryDateTime")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">
              Delivery Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="deliveryAddress"
              {...register("deliveryAddress", { required: "Delivery address is required" })}
              placeholder="e.g. VIE"
              className={errors.deliveryAddress ? "border-red-500" : ""}
            />
            {errors.deliveryAddress && <p className="text-sm text-red-500">{errors.deliveryAddress.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" {...register("price")} placeholder="e.g. 100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input id="vehicle" {...register("vehicle")} placeholder="e.g. AA955DD" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">Driver</Label>
              <Input id="driver" {...register("driver")} placeholder="e.g. John Smith" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Additional notes." rows={4} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting || clientsLoading || clients.length === 0}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save order"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
