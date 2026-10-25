import { redirect } from "next/navigation";

// Menu Pengelola digabung ke halaman Pengguna.
export const instant = false;

export default function Page() {
  redirect("/admin/pengguna");
}
