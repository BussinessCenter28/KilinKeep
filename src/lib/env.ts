// Centralized, validated access to the (public, anon-safe) frontend env.
// Only VITE_-prefixed vars exist in the browser bundle. If a secret ever gains a
// VITE_ prefix by mistake, it would surface here for review — keep this list tight.

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL'),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY'),
  /** Display-only hint for the admin nav link; never a security boundary. */
  ownerUserId: import.meta.env.VITE_OWNER_USER_ID ?? null,
} as const;
