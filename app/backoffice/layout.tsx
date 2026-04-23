import type { ReactNode } from "react";
import { AdminChrome } from "@/components/admin/AdminChrome";

export default function BackofficeLayout({ children }: { children: ReactNode }) {
  return <AdminChrome>{children}</AdminChrome>;
}
