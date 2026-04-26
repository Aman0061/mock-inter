import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <Topbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
