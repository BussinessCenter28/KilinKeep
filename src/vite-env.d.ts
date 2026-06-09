/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Optional: the owner's user id, used ONLY to show/hide the admin nav link.
   *  Real admin authorization is enforced server-side in Edge Functions. */
  readonly VITE_OWNER_USER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
