/// <reference types="vite/client" />

export type Theme = "dark" | "light" | "system"

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
