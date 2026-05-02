import { NextRequest, NextResponse } from "next/server";
import { connectionSchema } from "@/lib/validation";
import { requireSession } from "@/lib/session";
import { encryptSecret } from "@/lib/crypto";
import { connectionRepository } from "@/lib/repositories/connectionRepository";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSession();
    const body = await req.json();
    const parsed = connectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const created = await connectionRepository.create({
      userId: auth.userId,
      name: parsed.data.name,
      protocol: parsed.data.protocol,
      host: parsed.data.host,
      port: parsed.data.port,
      username: parsed.data.username,
      encryptedPassword: encryptSecret(parsed.data.password),
    });

    return NextResponse.json(
      {
        id: created.id,
        userId: created.userId,
        name: created.name,
        protocol: created.protocol,
        host: created.host,
        port: created.port,
        username: created.username,
      },
      { status: 201 },
    );
  } catch (error) {
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

    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const auth = await requireSession();
    const items = await connectionRepository.listForRole(
      auth.userId,
      auth.role,
    );

    return NextResponse.json(
      items.map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        protocol: c.protocol,
        host: c.host,
        port: c.port,
        username: c.username,
      })),
    );
  } catch (error) {
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

    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
