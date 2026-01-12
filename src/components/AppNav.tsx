"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { value: "document", label: "Document Check", href: "/" },
  { value: "compare", label: "Compare Documents", href: "/compare" },
  { value: "clause", label: "Manual Clause", href: "/clause-check" },
];

export function AppNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const activeValue = React.useMemo(() => {
    if (!pathname || pathname === "/") return "document";
    if (pathname.startsWith("/compare")) return "compare";
    if (pathname.startsWith("/clause-check")) return "clause";
    return "document";
  }, [pathname]);

  return (
    <Tabs
      value={activeValue}
      onValueChange={(value) => {
        const item = NAV_ITEMS.find((nav) => nav.value === value);
        if (item) {
          router.push(item.href);
        }
      }}
      className={cn("flex items-center justify-center", className)}
    >
      <TabsList className="inline-flex items-center gap-1 rounded-2xl bg-tan/20 px-1 py-0.5">
        {NAV_ITEMS.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-navy/80 data-[state=active]:bg-cream data-[state=active]:text-navy"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
