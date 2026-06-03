import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Garde optimiste (Next 16 proxy, ex-middleware) : on vérifie seulement la
 * présence du cookie de session, sans le valider (pas de DB à chaque requête).
 * La vraie vérification de rôle se fait dans les layouts `/backoffice` et
 * `/espace` via `auth.api.getSession` (defense in depth).
 *
 * Pas de cookie → on renvoie vers /auth en gardant la destination voulue.
 */
export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/backoffice/:path*", "/espace/:path*"],
};
