import { auth } from "@/auth";
import { Sidebar } from "./Sidebar";
import { GlobalSearch } from "./GlobalSearch";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session?.user?.name} userRole={session?.user?.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
          <GlobalSearch />
        </header>
        <main className="flex-1 px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
