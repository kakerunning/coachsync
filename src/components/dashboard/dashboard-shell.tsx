"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

type DashboardShellProps = {
  children: React.ReactNode;
  user: { name: string; role: string };
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header name={user.name} role={user.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
