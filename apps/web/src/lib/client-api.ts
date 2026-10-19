// Dipakai di Client Components. Request ke /api/* diteruskan Next ke Express (lihat next.config.ts).

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: isForm ? init.headers : { "Content-Type": "application/json", ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.message ?? "Terjadi kesalahan", body.errors);
  return body as T;
}
