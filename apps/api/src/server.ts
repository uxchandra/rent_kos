import { app } from "./app.ts";
import { env } from "./config/env.ts";

app.listen(env.PORT, () => {
  console.log(`SmartKos API berjalan di http://localhost:${env.PORT}`);
});
