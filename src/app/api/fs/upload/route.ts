import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { validateSafePath } from "@/lib/validation";
import { withConnectionProvider } from "@/lib/providerSession";
import { auditRepository } from "@/lib/repositories/auditRepository";
import { toUnifiedError } from "@/lib/errors";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession();
    const formData = await request.formData();

    const connectionId = Number(formData.get("connectionId"));
    const path = (formData.get("path") as string) || "/";
    const file = formData.get("file") as File;

    if (!connectionId || !validateSafePath(path) || !file) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message: "Missing required fields",
        },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = Readable.from([buffer]);

    const fullPath = path.endsWith("/")
      ? `${path}${file.name}`
      : `${path}/${file.name}`;

    await withConnectionProvider({
      connectionId,
      userId: auth.userId,
      role: auth.role,
      run: async (provider, resolvedConnectionId) => {
        await provider.upload(fullPath, stream, buffer.length);
        await auditRepository.log({
          userId: auth.userId,
          connectionId: resolvedConnectionId,
          action: "upload",
          path: fullPath,
        });
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
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
