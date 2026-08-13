/**
 * Reads a cookie value by name.
 */
export function getToken(name: string): string | undefined {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
  return undefined;
}

export async function signOutRails(): Promise<void> {
  const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

  await fetch("/users/sign_out", {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken ?? "" },
    redirect: "manual",
  });

  window.location.href = "/";
}
