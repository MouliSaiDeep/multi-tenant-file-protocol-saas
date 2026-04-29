import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { validateSafePath } from "@/lib/validation";
import { withConnectionProvider } from "@/lib/providerSession";
import { auditRepository } from "@/lib/repositories/auditRepository";
import { toUnifiedError } from "@/lib/errors";

async function deleteRecursively(provider: any, targetPath: string) {
  try {
    const entries = await provider.list(targetPath);
    for (const entry of entries) {
      const childPath =
        targetPath === "/" ? `/${entry.name}` : `${targetPath}/${entry.name}`;
      await deleteRecursively(provider, childPath);
    }
  } catch {
    // Not a directory or not listable; fall through to direct delete.
  }

  await provider.delete(targetPath);
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSession();
    const { searchParams } = new URL(request.url);
    const connectionId = Number(searchParams.get("connectionId"));
    const path = searchParams.get("path") || "";

    if (!connectionId || !validateSafePath(path)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message: "Missing or invalid required fields",
        },
        { status: 400 },
      );
    }

    await withConnectionProvider({
      connectionId,
      userId: auth.userId,
      role: auth.role,
      run: async (provider, resolvedConnectionId) => {
        await deleteRecursively(provider, path);
        await auditRepository.log({
          userId: auth.userId,
          connectionId: resolvedConnectionId,
          action: "delete",
          path,
        });
      },
    });

    return new NextResponse(null, { status: 204 });
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
