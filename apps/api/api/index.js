// Entry point Vercel: semua request diarahkan ke sini (lihat vercel.json).
// Memakai hasil build `tsc` di dist/ supaya import `.ts` sudah diubah ke `.js`.
export { app as default } from "../dist/app.js";
