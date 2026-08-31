import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schemas/*.ts",
  out: "./db/migration",
  dialect: "sqlite",
  dbCredentials: {
    url: "./db/local.db",
  },
} satisfies Config;