import { Suspense } from "react";

export const metadata = { title: "Login — Inventário CAU" };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
