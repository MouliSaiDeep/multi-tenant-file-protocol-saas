import type { Protocol } from "@/lib/types";

export interface ProviderConnectionConfig {
  protocol: Protocol;
  host: string;
  port: number;
  username: string;
  password: string;
}
