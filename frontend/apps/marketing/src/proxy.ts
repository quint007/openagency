import { NextRequest, NextResponse } from "next/server";

const BASIC_AUTH_REALM = "Open Agency Alpha";

const EXCLUDED_PATH_PATTERNS = [
  /^\/$/,
  /^\/about$/i,
  /^\/contact$/i,
  /^\/_next\//,
  /^\/favicon(?:-[\w-]+)?\.(?:ico|png|svg)$/i,
  /^\/apple-touch-icon(?:-[\w-]+)?\.png$/i,
  /^\/site\.webmanifest$/i,
  /^\/robots\.txt$/i,
  /^\/sitemap(?:.*)?\.xml$/i,
  /^\/feed\.xml$/i,
  /^\/blog(?:\/.*)?$/i,
  /^\/tools(?:\/.*)?$/i,
  /^\/privacy$/i,
  /^\/privacy\/cookies$/i,
  /^\/terms$/i,
  /^\/newsletter(?:\/.*)?$/i,
  /^\/api\/newsletter\/unsubscribe$/i,
  /^\/api\/revalidate(?:\/.*)?$/i,
];

const CREDENTIAL_PATHS = new Set(["/newsletter/confirm", "/newsletter/unsubscribe"]);

const isStaticAssetRequest = (pathname: string): boolean => {
  if (EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return true;
  }

  return /\.[^/]+$/.test(pathname);
};

const unauthorizedResponse = (): NextResponse =>
  new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${BASIC_AUTH_REALM}"`,
    },
  });

export function proxy(request: NextRequest): NextResponse {
  const username = process.env.ALPHA_BASIC_AUTH_USERNAME;
  const password = process.env.ALPHA_BASIC_AUTH_PASSWORD;

  if (!username || !password || isStaticAssetRequest(request.nextUrl.pathname)) {
    const response = NextResponse.next();
    if (CREDENTIAL_PATHS.has(request.nextUrl.pathname)) {
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
    }
    return response;
  }

  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const encodedCredentials = authorizationHeader.slice(6).trim();

  let decodedCredentials = "";

  try {
    decodedCredentials = atob(encodedCredentials);
  } catch {
    return unauthorizedResponse();
  }

  const separatorIndex = decodedCredentials.indexOf(":");

  if (separatorIndex === -1) {
    return unauthorizedResponse();
  }

  const providedUsername = decodedCredentials.slice(0, separatorIndex);
  const providedPassword = decodedCredentials.slice(separatorIndex + 1);

  if (providedUsername !== username || providedPassword !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
