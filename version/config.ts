export const getConfiguredVersion = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("simver") || "v0";
};
