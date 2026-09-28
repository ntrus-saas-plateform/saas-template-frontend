import { v1, withQuery } from "@/lib/api/paths";

/** Resolve a stored object key or an absolute URL for <img src>. */
export function storedFileSrc(keyOrUrl: string | null | undefined): string {
  if (!keyOrUrl) return "";
  if (
    /^(https?:|data:|blob:)/i.test(keyOrUrl) ||
    keyOrUrl.startsWith("/")
  ) {
    return keyOrUrl;
  }
  return withQuery(v1("files"), { key: keyOrUrl });
}
