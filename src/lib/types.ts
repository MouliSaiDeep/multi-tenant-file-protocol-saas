export type UserRole = "admin" | "member";
export type Protocol = "sftp" | "ftp" | "smb";

export interface UserRow {
  id: number;
  email: string;
  password: string;
  role: UserRole;
}

export interface ConnectionRow {
  id: number;
  userId: number;
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  username: string;
  encryptedPassword: string;
}

export interface AuditLogRow {
  id: number;
  userId: number;
  connectionId: number | null;
  action: string;
  path: string | null;
  timestamp: string;
}
