const TRUTHY = new Set(["1", "true", "yes", "on"]);

export function isLocalDevBypass() {
  const flag = process.env.LOCAL_DEV_BYPASS ?? process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS;
  return typeof flag === "string" && TRUTHY.has(flag.toLowerCase());
}
