import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { validateSafePath } from "@/lib/validation";
import { withConnectionProvider } from "@/lib/providerSession";
import { auditRepository } from "@/lib/repositories/auditRepository";
import { toUnifiedError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession();
    const params = req.nextUrl.searchParams;
    const connectionId = Number(params.get("connectionId"));
    const path = params.get("path") || "/";

    if (!connectionId || !validateSafePath(path)) {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    const items = await withConnectionProvider({
      connectionId,
      userId: auth.userId,
      role: auth.role,
      run: async (provider, resolvedConnectionId) => {
        const listed = await provider.list(path);
        await auditRepository.log({
          userId: auth.userId,
          connectionId: resolvedConnectionId,
          action: "list",
          path,
        });
        return listed;
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const unified = toUnifiedError(error);
    return NextResponse.json(
      { success: false, code: unified.code, message: unified.message },
      { status: unified.status },
    );
  }
}
