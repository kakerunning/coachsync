"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Dumbbell, Users, ClipboardList } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/sessions", label: "Sessions", icon: ClipboardList },
  { href: "/dashboard/programs", label: "Programs", icon: Dumbbell },
  { href: "/dashboard/athletes", label: "Athletes", icon: Users },
] as const;

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const visibleItems =
    role === "COACH" ? navItems : navItems.filter((item) => item.href !== "/dashboard/athletes");

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-white px-3 py-6">
      <div className="mb-8 px-3">
        <span className="text-lg font-bold tracking-tight text-gray-900">CoachSync</span>
      </div>

      <nav className="flex flex-col gap-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
