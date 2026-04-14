import type { FileSystemProvider } from "@/lib/FileSystemProvider";
import type { ProviderConnectionConfig } from "@/lib/providers/providerTypes";
import { SFTPProvider } from "@/lib/providers/SFTPProvider";
import { FTPProvider } from "@/lib/providers/FTPProvider";
import { SMBProvider } from "@/lib/providers/SMBProvider";

export class ProviderFactory {
  static create(config: ProviderConnectionConfig): FileSystemProvider {
    switch (config.protocol) {
      case "sftp":
        return new SFTPProvider(config);
      case "ftp":
        return new FTPProvider(config);
      case "smb":
        return new SMBProvider(config);
      default:
        throw new Error(
          `Unsupported protocol: ${String((config as { protocol: string }).protocol)}`,
        );
    }
  }
}
