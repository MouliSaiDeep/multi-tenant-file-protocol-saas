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
  const rawMsg = error instanceof Error ? error.message : "";

  // Auth failures — covers SFTP, FTP 530, SMB STATUS_LOGON_FAILURE / STATUS_ACCESS_DENIED
  if (
    msg.includes("auth") ||
    msg.includes("login") ||
    msg.includes("530") ||
    msg.includes("denied") ||
    msg.includes("logon_failure") ||
    msg.includes("logon failure") ||
    msg.includes("access_denied") ||
    msg.includes("access denied") ||
    msg.includes("invalid credentials") ||
    msg.includes("wrong password") ||
    msg.includes("bad password") ||
    msg.includes("unauthorized") ||
    msg.includes("status_logon") ||
    msg.includes("status_access") ||
    rawMsg.includes("C000006D") ||
    rawMsg.includes("C0000022")
  ) {
    return new FileSystemError("AUTH_FAILED");
  }

  if (
    msg.includes("not found") ||
    msg.includes("no such file") ||
    msg.includes("no such path") ||
    msg.includes("status_object_name_not_found") ||
    msg.includes("object_name_not_found")
  ) {
    return new FileSystemError("NOT_FOUND", undefined, 404);
  }

  if (
    msg.includes("permission") ||
    msg.includes("forbidden") ||
    msg.includes("status_sharing_violation")
  ) {
    return new FileSystemError("PERMISSION_DENIED", undefined, 403);
  }

  if (
    msg.includes("connect") ||
    msg.includes("timeout") ||
    msg.includes("econn") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("socket hang up") ||
    msg.includes("network")
  ) {
    return new FileSystemError("CONNECTION_FAILED", undefined, 400);
  }

  return new FileSystemError("UNKNOWN", undefined, 500);
}
