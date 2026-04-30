"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (!res || res.error) {
      setError("Invalid credentials");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex">
      {/* Left side: App branding */}
      <div className="hidden lg:flex lg:w-3/5 lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-slate-800 lg:to-slate-900 lg:px-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-teal-500/20">
            <Lock className="h-8 w-8 text-teal-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">File Gateway</h1>
        </div>
        <p className="text-lg text-slate-300 max-w-md">
          Manage SFTP, FTP, and SMB connections with a unified interface
        </p>
      </div>

      {/* Right side: Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="p-2 rounded-lg bg-teal-500/20">
              <Lock className="h-6 w-6 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">File Gateway</h1>
          </div>

          <div className="card card-inner">
            <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full mt-6"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-center text-slate-400 text-sm mt-6">
              Demo credentials available in documentation
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
