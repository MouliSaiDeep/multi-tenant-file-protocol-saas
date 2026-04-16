import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { auditRepository } from "@/lib/repositories/auditRepository";

export async function GET() {
  try {
    const auth = await requireSession();

    if (auth.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const logs = await auditRepository.listAll();
    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
