"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [err, setErr] = useState<string | null>(null);

  const onRegister = async () => {
    setErr(null);
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password, role }),
      });
      setSession({ token: data.token, username: data.username, role: data.role });
      router.replace(data.role === "ADMIN" ? "/admin" : "/user");
    } catch (e: any) {
      setErr(e.message || "Register failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex gap-2">
            <Button variant={role === "USER" ? "default" : "outline"} onClick={() => setRole("USER")} className="flex-1">
              USER
            </Button>
            <Button variant={role === "ADMIN" ? "default" : "outline"} onClick={() => setRole("ADMIN")} className="flex-1">
              ADMIN
            </Button>
          </div>
          {err && <p className="text-sm text-red-500">{err}</p>}
          <Button className="w-full" onClick={onRegister}>Create Account</Button>
          <Button className="w-full" variant="outline" onClick={() => router.push("/login")}>
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
