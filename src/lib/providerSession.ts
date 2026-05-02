import { decryptSecret } from "@/lib/crypto";
import { ProviderFactory } from "@/lib/providers/ProviderFactory";
import { connectionRepository } from "@/lib/repositories/connectionRepository";
import { FileSystemError } from "@/lib/errors";

export async function getConnectionProvider(input: {
  connectionId: number;
  userId: number;
  role: "admin" | "member";
}): Promise<{
  provider: ReturnType<typeof ProviderFactory.create>;
  connectionId: number;
}> {
  const connection = await connectionRepository.findAccessibleById(
    input.connectionId,
    input.userId,
    input.role,
  );

  if (!connection) {
    throw new FileSystemError("NOT_FOUND", "Connection not found.", 404);
  }

  const provider = ProviderFactory.create({
    protocol: connection.protocol,
    host: connection.host,
    port: connection.port,
    username: connection.username,
    password: decryptSecret(connection.encryptedPassword),
  });

  return { provider, connectionId: connection.id };
}

export async function withConnectionProvider<T>(input: {
  connectionId: number;
  userId: number;
  role: "admin" | "member";
  run: (
    provider: ReturnType<typeof ProviderFactory.create>,
    connectionId: number,
  ) => Promise<T>;
}): Promise<T> {
  const { provider, connectionId } = await getConnectionProvider(input);
  try {
    return await input.run(provider, connectionId);
  } finally {
    await provider.disconnect();
  }
}
