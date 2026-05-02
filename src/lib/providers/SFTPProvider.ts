import type { Client as SSH2ClientType } from "ssh2";
import { Readable } from "stream";
import { FileSystemProvider, type FileEntry } from "@/lib/FileSystemProvider";
import { FileSystemError, toUnifiedError } from "@/lib/errors";
import type { ProviderConnectionConfig } from "@/lib/providers/providerTypes";

export class SFTPProvider implements FileSystemProvider {
  private client: SSH2ClientType | null = null;
  private sftp: any = null;

  constructor(private readonly config: ProviderConnectionConfig) {}

  private async ensureConnected(): Promise<void> {
    if (this.sftp) return;

    if (!this.client) {
      const ssh2 = await import("ssh2");
      this.client = new ssh2.Client();
    }

    await new Promise<void>((resolve, reject) => {
      this.client!.on("ready", () => {
        this.client!.sftp((err: Error | undefined, sftp: any) => {
          if (err) {
            reject(new FileSystemError("CONNECTION_FAILED", err.message));
            return;
          }
          this.sftp = sftp;
          resolve();
        });
      })
        .on("error", (err: any) => {
          reject(toUnifiedError(err));
        })
        .connect({
          host: this.config.host,
          port: this.config.port,
          username: this.config.username,
          password: this.config.password,
          readyTimeout: 10000,
        });
    });
  }

  async list(path: string): Promise<FileEntry[]> {
    try {
      await this.ensureConnected();
      const entries = await new Promise<any[]>((resolve, reject) => {
        this.sftp.readdir(path, (err: Error | null, list: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(list || []);
        });
      });

      return entries.map((entry: any) => ({
        name: entry.filename,
        type: entry.longname?.startsWith("d") ? "d" : "f",
        size: Number(entry.attrs?.size || 0),
        modifiedAt: new Date(Number(entry.attrs?.mtime || Date.now()) * 1000),
      }));
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async download(path: string): Promise<Readable> {
    try {
      await this.ensureConnected();
      return new Promise<Readable>((resolve, reject) => {
        const stream = this.sftp.createReadStream(path);
        stream.on("open", () => resolve(stream));
        stream.on("error", (err: Error) => reject(toUnifiedError(err)));
      });
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async upload(path: string, stream: Readable): Promise<void> {
    try {
      await this.ensureConnected();
      await new Promise<void>((resolve, reject) => {
        const write = this.sftp.createWriteStream(path);
        write.on("close", () => resolve());
        write.on("error", (err: Error) => reject(err));
        stream.pipe(write);
      });
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await this.ensureConnected();
      await new Promise<void>((resolve, reject) => {
        this.sftp.unlink(path, (err: Error | null) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async rename(from: string, to: string): Promise<void> {
    try {
      await this.ensureConnected();
      await new Promise<void>((resolve, reject) => {
        this.sftp.rename(from, to, (err: Error | null) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.end();
    }
  }
}
