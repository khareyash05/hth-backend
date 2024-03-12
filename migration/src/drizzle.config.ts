import type { Config } from "drizzle-kit";

export default {
  schema: "./models/schema.ts",
  out: "./drizzle",
  driver:"pg",
  dbCredentials:{
    connectionString:""
  },
  introspect:{
    casing:'preserve'
  }
} satisfies Config;