declare module "@marsaud/smb2" {
  export interface SMB2Options {
    share: string;
    domain?: string;
    username?: string;
    password?: string;
    port?: number;
    autoCloseTimeout?: number;
  }

  export type SMB2Callback<T = unknown> = (
    err: Error | null,
    result?: T,
  ) => void;

  export default class SMB2 {
    constructor(options: SMB2Options);
    readdir(path: string, callback: SMB2Callback<string[]>): void;
    stat(path: string, callback: SMB2Callback<any>): void;
    readFile(path: string, callback: SMB2Callback<Buffer>): void;
    writeFile(path: string, data: Buffer, callback: SMB2Callback<void>): void;
    unlink(path: string, callback: SMB2Callback<void>): void;
    rename(
      oldPath: string,
      newPath: string,
      callback: SMB2Callback<void>,
    ): void;
    close(callback: SMB2Callback<void>): void;
  }
}
