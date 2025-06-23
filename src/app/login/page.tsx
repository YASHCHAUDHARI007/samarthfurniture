
"use client";

import { useState } from "react";
import { Armchair } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type UserRole = "owner" | "coordinator" | "factory";

// To add more users, add a new object to this array.
// For example: { email: "newuser@furnishflow.com", password: "newpassword", role: "coordinator" }
// User Roles:
// - owner: Can access all pages including user management.
// - coordinator: Can access main dashboard and order pages.
// - factory: Can only access the factory dashboard.
const allowedUsers = [
  { email: "owner@furnishflow.com", password: "password123", role: "owner" as UserRole },
  { email: "coordinator@furnishflow.com", password: "password456", role: "coordinator" as UserRole },
  { email: "factory@furnishflow.com", password: "password789", role: "factory" as UserRole },
];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const user = allowedUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('loggedInUser', user.email);
        localStorage.setItem('userRole', user.role);
      }
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      setTimeout(() => {
        if (user.role === "factory") {
            router.push("/factory-dashboard");
        } else {
            router.push("/");
        }
      }, 1000);
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="inline-block rounded-lg bg-primary/20 p-3 text-primary">
            <Armchair className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Login to FurnishFlow</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
