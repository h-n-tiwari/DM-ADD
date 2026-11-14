import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

type Session = typeof auth.$Infer.Session;

type AuthenticatedHandler = (
  req: Request,
  session: Session
) => Promise<Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request): Promise<Response> => {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(req, session);
  };
}
