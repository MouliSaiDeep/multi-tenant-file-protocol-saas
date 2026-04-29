import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { connectionRepository } from "@/lib/repositories/connectionRepository";
import { encryptSecret } from "@/lib/crypto";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  protocol: z.enum(["sftp", "ftp", "smb"]).optional(),
  host: z.string().min(1).max(255).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  username: z.string().min(1).max(255).optional(),
  password: z.string().min(1).max(255).optional(),
});

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireSession();
    const connectionId = Number(params.id);

    const connection = await connectionRepository.findById(connectionId);
    if (!connection) {
      return NextResponse.json(
        { success: false, code: "NOT_FOUND", message: "Connection not found" },
        { status: 404 },
      );
    }

    if (auth.role !== "admin" && connection.userId !== auth.userId) {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          message: "You do not have permission to delete this connection",
        },
        { status: 403 },
      );
    }

    await connectionRepository.delete(connectionId);
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
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireSession();
    const connectionId = Number(params.id);

    const connection = await connectionRepository.findById(connectionId);
    if (!connection) {
      return NextResponse.json(
        { success: false, code: "NOT_FOUND", message: "Connection not found" },
        { status: 404 },
      );
    }

    if (auth.role !== "admin" && connection.userId !== auth.userId) {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          message: "You do not have permission to update this connection",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message: "Invalid input",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.protocol !== undefined)
      updates.protocol = parsed.data.protocol;
    if (parsed.data.host !== undefined) updates.host = parsed.data.host;
    if (parsed.data.port !== undefined) updates.port = parsed.data.port;
    if (parsed.data.username !== undefined)
      updates.username = parsed.data.username;
    if (parsed.data.password !== undefined) {
      updates.encryptedPassword = encryptSecret(parsed.data.password);
    }

    const updated = await connectionRepository.update(connectionId, updates);

    return NextResponse.json({
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      protocol: updated.protocol,
      host: updated.host,
      port: updated.port,
      username: updated.username,
    });
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
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
