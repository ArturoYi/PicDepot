/** Same H3Event as Nitro route handlers (avoids duplicate `h3` installs + module augmentation mismatch). */
export type H3Event = Parameters<Parameters<typeof defineEventHandler>[0]>[0]
