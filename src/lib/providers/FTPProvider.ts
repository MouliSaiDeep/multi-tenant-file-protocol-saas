import { Client } from "basic-ftp";
import { Readable, PassThrough } from "stream";
import { FileSystemProvider, type FileEntry } from "@/lib/FileSystemProvider";
import { toUnifiedError } from "@/lib/errors";
import type { ProviderConnectionConfig } from "@/lib/providers/providerTypes";

export class FTPProvider implements FileSystemProvider {
  private client: Client;
  private connected = false;

  constructor(private readonly config: ProviderConnectionConfig) {
    this.client = new Client(10000);
  }

  private async ensureConnected() {
    if (this.connected) {
      return;
    }

    await this.client.access({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      secure: false,
    });

    this.connected = true;
  }

  async list(path: string): Promise<FileEntry[]> {
    try {
      await this.ensureConnected();
      const entries = await this.client.list(path);
      return entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory ? "d" : "f",
        size: Number(entry.size || 0),
        modifiedAt: entry.modifiedAt || new Date(),
      }));
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async download(path: string): Promise<Readable> {
    try {
      await this.ensureConnected();
      const pass = new PassThrough();
      this.client
        .downloadTo(pass, path)
        .then(() => pass.end())
        .catch((err) => pass.emit("error", err));
      return pass;
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async upload(path: string, stream: Readable): Promise<void> {
    try {
      await this.ensureConnected();
      await this.client.uploadFrom(stream, path);
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await this.ensureConnected();
      await this.client.remove(path);
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async rename(from: string, to: string): Promise<void> {
    try {
      await this.ensureConnected();
      await this.client.rename(from, to);
    } catch (error) {
      throw toUnifiedError(error);
    }
  }

  async disconnect(): Promise<void> {
    this.client.close();
    this.connected = false;
  }
}
