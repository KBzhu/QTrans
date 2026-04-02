/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_TYPE: 'tenant' | 'admin'
  readonly VITE_API_BASE_URL: string
  readonly VITE_MOCK_ENABLED: 'true' | 'false'
  readonly VITE_UPLOAD_CHUNK_SIZE: string
  readonly VITE_DEV_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_TITLE__: string
