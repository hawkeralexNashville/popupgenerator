"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/websites", label: "Websites" },
  { href: "/analytics", label: "Analytics" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard navigation">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/websites" &&
            (pathname.startsWith("/sites/") || pathname.startsWith("/campaigns/")));

        return (
          <Link href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
