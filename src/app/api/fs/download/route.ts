import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { validateSafePath } from "@/lib/validation";
import { withConnectionProvider } from "@/lib/providerSession";
import { auditRepository } from "@/lib/repositories/auditRepository";
import { toUnifiedError } from "@/lib/errors";
import { Readable } from "stream";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession();
    const params = req.nextUrl.searchParams;
    const connectionId = Number(params.get("connectionId"));
    const path = params.get("path") || "";

    if (!connectionId || !validateSafePath(path)) {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    const { stream, resolvedConnectionId } = await withConnectionProvider({
      connectionId,
      userId: auth.userId,
      role: auth.role,
      run: async (provider, connId) => ({
        stream: await provider.download(path),
        resolvedConnectionId: connId,
      }),
    });

    await auditRepository.log({
      userId: auth.userId,
      connectionId: resolvedConnectionId,
      action: "download",
      path,
    });

    const filename = path.split("/").pop() || "download.bin";

    const webStream = Readable.toWeb(stream);

    return new NextResponse(webStream as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
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
