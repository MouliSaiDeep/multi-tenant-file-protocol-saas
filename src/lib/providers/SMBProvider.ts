import SMB2 from "@marsaud/smb2";
import { Readable } from "stream";
import { FileSystemProvider, type FileEntry } from "@/lib/FileSystemProvider";
import { toUnifiedError } from "@/lib/errors";
import type { ProviderConnectionConfig } from "@/lib/providers/providerTypes";

function promisifyCall<T>(
  fn: (cb: (err: Error | null, result?: T) => void) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    fn((err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result as T);
    });
  });
}

export class SMBProvider implements FileSystemProvider {
  private client: SMB2;

  constructor(private readonly config: ProviderConnectionConfig) {
    const share = `\\\\${config.host}\\public`;
    this.client = new SMB2({
      share,
      domain: "WORKGROUP",
      username: config.username,
      password: config.password,
      port: config.port,
      autoCloseTimeout: 10000,
    });
  }

  async list(path: string): Promise<FileEntry[]> {
    try {
      const names = await promisifyCall<string[]>((cb) =>
        this.client.readdir(path, cb),
      );

      const entries = await Promise.all(
        names.map(async (name) => {
          const fullPath = `${path.replace(/\/$/, "")}/${name}`;
          const stat = await promisifyCall<any>((cb) =>
            this.client.stat(fullPath, cb),
          );
          return {
            name,
            type: stat.isDirectory() ? "d" : "f",
            size: Number(stat.size || 0),
            modifiedAt: stat.mtime ? new Date(stat.mtime) : new Date(),
          } as FileEntry;
        }),
      );

      return entries;
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async download(path: string): Promise<Readable> {
    try {
      const data = await promisifyCall<Buffer>((cb) =>
        this.client.readFile(path, cb),
      );
      return Readable.from(data);
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async upload(path: string, stream: Readable): Promise<void> {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const payload = Buffer.concat(chunks);
      await promisifyCall<void>((cb) =>
        this.client.writeFile(path, payload, cb),
      );
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await promisifyCall<void>((cb) => this.client.unlink(path, cb));
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async rename(from: string, to: string): Promise<void> {
    try {
      await promisifyCall<void>((cb) => this.client.rename(from, to, cb));
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async disconnect(): Promise<void> {
    await promisifyCall<void>((cb) => this.client.close(cb));
  }
}
