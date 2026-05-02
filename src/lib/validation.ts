import { z } from "zod";

const protocolSchema = z.enum(["sftp", "ftp", "smb"]);

export const connectionSchema = z.object({
  name: z.string().min(1).max(120),
  protocol: protocolSchema,
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1).max(255),
  password: z.string().min(1).max(255),
});

export function validateSafePath(path: string): boolean {
  if (!path || path.trim().length === 0) {
    return false;
  }
  if (!path.startsWith("/")) {
    return false;
  }
  if (path.includes("..") || path.includes("\\")) {
    return false;
  }
  return true;
}
