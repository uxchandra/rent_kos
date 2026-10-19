export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, details?: unknown) => new HttpError(400, msg, details);
export const unauthorized = (msg = "Silakan login terlebih dahulu") => new HttpError(401, msg);
export const forbidden = (msg = "Anda tidak memiliki akses") => new HttpError(403, msg);
export const notFound = (msg = "Data tidak ditemukan") => new HttpError(404, msg);
