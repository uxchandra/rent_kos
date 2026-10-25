import { redirect } from "next/navigation";

// Menu Pengelola digabung ke halaman Pengguna.
export default function Page() {
  redirect("/admin/pengguna");
}
