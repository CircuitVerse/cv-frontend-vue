export function getToken(name: string): string | undefined {
  const cookieValue = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (cookieValue !== undefined) return cookieValue;
  // Fallback to localStorage for Tauri and contexts where the cvt cookie isn't available
  if (name === "cvt") {
    return localStorage.getItem("cv_token") ?? undefined;
  }
  return undefined;
}

export function signOutRails(csrfToken: string): void {
  const form = document.createElement("form");
  form.method = "post";
  form.action = "/users/sign_out";

  const methodInput = document.createElement("input");
  methodInput.type = "hidden";
  methodInput.name = "_method";
  methodInput.value = "delete";
  form.appendChild(methodInput);

  const csrfInput = document.createElement("input");
  csrfInput.type = "hidden";
  csrfInput.name = "authenticity_token";
  csrfInput.value = csrfToken;
  form.appendChild(csrfInput);

  document.body.appendChild(form);
  form.submit();
}
