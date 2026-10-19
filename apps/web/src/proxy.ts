import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pengecekan optimistis: tanpa cookie langsung ke /login.
// Validasi token & role tetap dilakukan oleh API Express.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("smartkos_token")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/penghuni/:path*"],
};
