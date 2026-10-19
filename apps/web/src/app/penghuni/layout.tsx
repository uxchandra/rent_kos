import { AuthProvider } from "@/components/auth-provider";

export default function PenghuniLayout({ children }: LayoutProps<"/penghuni">) {
  return <AuthProvider roles={["TENANT"]}>{children}</AuthProvider>;
}
