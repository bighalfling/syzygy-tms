import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Пропускаем служебные пути и страницу логина
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  // Если нет сессии — всегда на /login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Какие пути обрабатывает proxy
export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
