import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — MITM PlacePro",
  description: "Sign in to the MITM College Placement Management System",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
