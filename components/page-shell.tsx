import React from "react";

export default function PageShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="w-full">
      <div className="max-w-[2000px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-[#111827]">{title}</h1>
          {action ? <div>{action}</div> : null}
        </div>

        {children}
      </div>
    </main>
  );
}
