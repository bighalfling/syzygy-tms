"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import Image from "next/image";

const nav = [
  { href: "/trips", label: "Trips" },
  { href: "/orders", label: "Orders" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/drivers", label: "Drivers" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Invoices" },
];

function isActive(pathname: string, href: string) {
  if (href === "/orders") return pathname === "/orders" || pathname.startsWith("/orders/");
  if (href === "/vehicles") return pathname === "/vehicles" || pathname.startsWith("/vehicles/");
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-[#E5E7EB]">
      <div className="w-full px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-[#111827] font-medium">
          <span className="text-base font-semibold tracking-wide">
            SYZYGY-LOG <span className="text-[var(--brand-green)]">TMS</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "text-sm font-medium transition-colors",
                  active ? "text-[var(--brand-green)]" : "text-gray-600 hover:text-[#111827]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
