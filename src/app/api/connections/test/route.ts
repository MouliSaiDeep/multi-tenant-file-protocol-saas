import { NextRequest, NextResponse } from "next/server";
import { connectionSchema } from "@/lib/validation";
import { requireSession } from "@/lib/session";
import { ProviderFactory } from "@/lib/providers/ProviderFactory";
import { toUnifiedError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json();
    const parsed = connectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    const provider = ProviderFactory.create(parsed.data);

    try {
      await provider.list("/");
      return NextResponse.json({
        success: true,
        message: "Connection successful.",
      });
    } finally {
      await provider.disconnect();
    }
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
      { status: 400 },
    );
  }
}
