import { Readable } from "stream";

export interface FileEntry {
  name: string;
  type: "f" | "d";
  size: number;
  modifiedAt: Date;
}

export interface FileSystemProvider {
  list(path: string): Promise<FileEntry[]>;
  download(path: string): Promise<Readable>;
  upload(path: string, stream: Readable, size: number): Promise<void>;
  delete(path: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  disconnect(): Promise<void>;
}
