import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    userId: Number(session.user.id),
    role: session.user.role,
  };
}
