import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { validateSafePath } from "@/lib/validation";
import { withConnectionProvider } from "@/lib/providerSession";
import { auditRepository } from "@/lib/repositories/auditRepository";
import { toUnifiedError } from "@/lib/errors";
import { z } from "zod";

const renameSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession();
    const { searchParams } = new URL(request.url);
    const connectionId = Number(searchParams.get("connectionId"));

    const body = await request.json();
    const parsed = renameSchema.safeParse(body);

    if (!connectionId || !parsed.success) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message: "Missing or invalid required fields",
        },
        { status: 400 },
      );
    }

    const { from, to } = parsed.data;

    if (!validateSafePath(from) || !validateSafePath(to)) {
      return NextResponse.json(
        { success: false, code: "INVALID_PATH", message: "Invalid path" },
        { status: 400 },
      );
    }

    await withConnectionProvider({
      connectionId,
      userId: auth.userId,
      role: auth.role,
      run: async (provider, resolvedConnectionId) => {
        await provider.rename(from, to);
        await auditRepository.log({
          userId: auth.userId,
          connectionId: resolvedConnectionId,
          action: "rename",
          path: from,
        });
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
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
