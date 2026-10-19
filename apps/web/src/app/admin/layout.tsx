import { AuthProvider } from "@/components/auth-provider";
import { AdminShell } from "./admin-shell";

const ADMIN_ROLES = ["OWNER", "ADMIN"] as const;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AuthProvider roles={[...ADMIN_ROLES]}>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
