export type FileSystemErrorCode =
  | "AUTH_FAILED"
  | "NOT_FOUND"
  | "PERMISSION_DENIED"
  | "CONNECTION_FAILED"
  | "INVALID_PATH"
  | "UNKNOWN";

const DEFAULT_MESSAGES: Record<FileSystemErrorCode, string> = {
  AUTH_FAILED: "Authentication failed. Please check your credentials.",
  NOT_FOUND: "The requested file or path was not found.",
  PERMISSION_DENIED: "Permission denied.",
  CONNECTION_FAILED: "Unable to establish a connection.",
  INVALID_PATH: "Invalid path.",
  UNKNOWN: "An unexpected file system error occurred.",
};

export class FileSystemError extends Error {
  code: FileSystemErrorCode;
  status: number;

  constructor(code: FileSystemErrorCode, message?: string, status = 400) {
    super(message || DEFAULT_MESSAGES[code]);
    this.code = code;
    this.status = status;
  }
}

export function toUnifiedError(error: unknown): FileSystemError {
  if (error instanceof FileSystemError) {
    return error;
  }

  const msg = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    msg.includes("auth") ||
    msg.includes("login") ||
    msg.includes("530") ||
    msg.includes("denied")
  ) {
    return new FileSystemError("AUTH_FAILED");
  }

  if (msg.includes("not found") || msg.includes("no such file")) {
    return new FileSystemError("NOT_FOUND", undefined, 404);
  }

  if (msg.includes("permission")) {
    return new FileSystemError("PERMISSION_DENIED", undefined, 403);
  }

  if (
    msg.includes("connect") ||
    msg.includes("timeout") ||
    msg.includes("econn")
  ) {
    return new FileSystemError("CONNECTION_FAILED", undefined, 400);
  }

  return new FileSystemError("UNKNOWN", undefined, 500);
}
