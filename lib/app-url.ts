type RequestHeaders = Pick<Headers, "get">;

/** Resolve the public application origin used for assets installed on customer sites. */
export function getAppBaseUrl(
  configuredUrl: string | undefined,
  requestHeaders?: RequestHeaders,
) {
  const configuredOrigin = configuredUrl?.trim();

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "");
  }

  const forwardedHost = requestHeaders?.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || requestHeaders?.get("host")?.trim();

  if (host) {
    const forwardedProtocol = requestHeaders?.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProtocol || (host.startsWith("localhost") ? "http" : "https");
    return `${protocol}://${host}`.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}
