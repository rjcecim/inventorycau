import { auth } from "@/auth";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session?.user?.name} userRole={session?.user?.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
