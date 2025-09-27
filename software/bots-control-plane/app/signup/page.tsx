"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole]   = useState<"creator"|"agency"|"admin">("creator");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          email: email || `${role}@example.com`, 
          password: "Password123!", // Default password for demo
          role 
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Signup failed (${res.status})`);
      }
      
      const data = await res.json();
      console.log("Signup successful:", data);
      
      // Redirect based on role
      switch (role) {
        case "creator":
          r.push("/creator");
          break;
        case "agency":
          r.push("/agency");
          break;
        case "admin":
          r.push("/admin");
          break;
        default:
          r.push("/");
      }
    } catch (e:any) {
      setErr(e?.message || "Signup failed");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-xl border p-6 shadow-sm
                   bg-white text-gray-900 dark:bg-neutral-900 dark:text-neutral-100">
        <h1 className="text-2xl font-semibold">Create account</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm">Email</label>
          <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2 outline-none
                       bg-white text-gray-900 placeholder:text-gray-400
                       dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400"
            placeholder="you@example.com" />
        </div>

        <div className="space-y-1">
          <label htmlFor="role" className="text-sm">Role</label>
          <select id="role" value={role} onChange={e=>setRole(e.target.value as any)}
            className="w-full rounded-md border px-3 py-2
                       bg-white text-gray-900 dark:bg-neutral-800 dark:text-neutral-100">
            <option value="creator">Creator</option>
            <option value="agency">Agency</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {err && <div className="text-sm text-red-600 dark:text-red-400">{err}</div>}

        <button type="submit" disabled={loading}
          className="w-full rounded-md border px-3 py-2
                     bg-black text-white hover:bg-black/90 disabled:opacity-60
                     dark:bg-white dark:text-black dark:hover:bg-white/90">
          Create account
        </button>

        <div className="text-xs text-muted-foreground text-center">
          Already have an account? <a href="/login" className="underline">Sign in</a>
        </div>
      </form>
    </main>
  );
}
