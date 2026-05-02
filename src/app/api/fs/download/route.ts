import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { validateSafePath } from "@/lib/validation";
import { getConnectionProvider } from "@/lib/providerSession";
import { auditRepository } from "@/lib/repositories/auditRepository";
import { toUnifiedError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  let provider:
    | Awaited<ReturnType<typeof getConnectionProvider>>["provider"]
    | null = null;

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

    const result = await getConnectionProvider({
      connectionId,
      userId: auth.userId,
      role: auth.role,
    });

    provider = result.provider;
    const stream = await provider.download(path);

    await auditRepository.log({
      userId: auth.userId,
      connectionId: result.connectionId,
      action: "download",
      path,
    });

    const filename = path.split("/").pop() || "download.bin";

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);

    await provider.disconnect();
    provider = null;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (provider) {
      await provider.disconnect().catch(() => {});
      provider = null;
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "Authentication required.",
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
