import { auth } from "@/app/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    const idToken = authorization.split("Bearer ")[1];
    try {
      const decodedToken = await auth.verifyIdToken(idToken);

      if (decodedToken) {
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        return NextResponse.json({ success: "Logged in" }, {
          status: 200,
          headers: {
            'Set-Cookie': `session=${sessionCookie}; Max-Age=${expiresIn}; Path=/; HttpOnly; Secure;`,
          }
        });
      }
    } catch (error) {
      console.error("Error verifying ID token:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get("session")?.value || "";

  if (!session) {
    return NextResponse.json({ isLogged: false }, { status: 401 });
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(session, true);
    if (decodedClaims) {
      return NextResponse.json({ isLogged: true }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ isLogged: false }, { status: 401 });
  }
}
