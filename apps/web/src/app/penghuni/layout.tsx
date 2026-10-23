import { AuthProvider } from "@/components/auth-provider";
import { TenantProviders } from "./providers";

// Area login dirender di klien setelah cek sesi, jadi tidak perlu divalidasi untuk instant navigation.
export const instant = false;

export default function PenghuniLayout({ children }: LayoutProps<"/penghuni">) {
  return (
    <AuthProvider roles={["TENANT"]}>
      <TenantProviders>{children}</TenantProviders>
    </AuthProvider>
  );
}
