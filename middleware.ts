const REALM = "JobPA Private Proposal";
const PROPOSAL_USER = "kimberly";
const NO_INDEX = "noindex, nofollow, noarchive, nosnippet, noimageindex";

export const config = {
  matcher: ["/proposal/:path*"],
};

function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "X-Robots-Tag": NO_INDEX,
      "Cache-Control": "private, no-store",
    },
  });
}

function getBasicAuthPassword(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) return null;

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const splitAt = decoded.indexOf(":");
    if (splitAt < 0) return null;

    return {
      user: decoded.slice(0, splitAt),
      password: decoded.slice(splitAt + 1),
    };
  } catch {
    return null;
  }
}

export default function middleware(request: Request) {
  const expectedPassword = process.env.PROPOSAL_PASSWORD;
  if (!expectedPassword) return unauthorized();

  const auth = getBasicAuthPassword(request);
  if (auth?.user !== PROPOSAL_USER || auth.password !== expectedPassword) {
    return unauthorized();
  }

  // Returning nothing lets Vercel continue to the static SPA rewrite.
  return;
}
