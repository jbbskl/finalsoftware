"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AuthDialog({ open = true }: { open?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"login"|"create">("login");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")||"");
    const password = String(form.get("password")||"");
    
    console.log("[AUTH] Attempting login with:", { email });
    
    try {
      const res = await signIn("credentials", { 
        email, 
        password, 
        redirect: false 
      });
      
      console.log("[AUTH] SignIn result:", res);
      
      if (res?.ok && !res?.error) {
        toast.success("Logged in successfully!");
        window.location.href = "/"; // Force full page reload to trigger redirects
      } else {
        console.log("[AUTH] Login failed:", res?.error);
        toast.error(res?.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      toast.error("Login failed");
    }
  }

  async function handleDemo(role: "creator"|"agency"|"admin") {
    const email = `demo.${role}@example.com`;
    
    console.log("[AUTH] Demo login attempt:", { email, role });
    
    try {
      const res = await signIn("credentials", { 
        email, 
        password: "demopass", 
        redirect: false 
      });
      
      console.log("[AUTH] Demo signIn result:", res);
      
      if (res?.ok && !res?.error) {
        toast.success(`Logged in as ${role}`);
        window.location.href = "/"; // Force full page reload
      } else {
        console.log("[AUTH] Demo login failed:", res?.error);
        toast.error(res?.error || "Demo login failed");
      }
    } catch (error) {
      console.error("[AUTH] Demo login error:", error);
      toast.error("Demo login failed");
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    
    console.log("[AUTH] Creating account:", { email: payload.email, role: payload.role });
    
    try {
      const res = await fetch("/api/auth/create", { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      console.log("[AUTH] Create account response:", data);
      
      if (res.ok) {
        toast.success("Account created successfully! Please log in.");
        setTab("login");
      } else {
        console.log("[AUTH] Create account failed:", data);
        toast.error(data.error || "Could not create account");
      }
    } catch (error) {
      console.error("[AUTH] Create account error:", error);
      toast.error("Account creation failed");
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-[480px] rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Welcome</DialogTitle>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={(v)=>setTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="create">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6 space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  name="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  required
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  name="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  required
                  className="rounded-xl"
                />
              </div>
              
              <Button type="submit" className="w-full rounded-xl">
                Sign In
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or try a demo
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={()=>handleDemo("creator")} 
                  className="rounded-xl"
                >
                  Creator
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={()=>handleDemo("agency")} 
                  className="rounded-xl"
                >
                  Agency
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={()=>handleDemo("admin")} 
                  className="rounded-xl"
                >
                  Admin
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="create" className="mt-6 space-y-4">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input 
                  id="create-email"
                  name="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  required
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <Input 
                  id="create-password"
                  name="password" 
                  type="password" 
                  placeholder="Create a password" 
                  required
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="creator">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="creator">Creator</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full rounded-xl">
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
