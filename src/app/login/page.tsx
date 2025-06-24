
"use client";

import { useState, useEffect } from "react";
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
import type { User } from "@/lib/types";

const initialUsers: User[] = [
  { id: "1", username: "owner", password: "password123", role: "owner" },
  { id: "2", username: "coordinator", password: "password456", role: "coordinator" },
  { id: "3", username: "factory", password: "password789", role: "factory" },
  { id: "4", username: "admin", password: "password", role: "administrator" },
];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Seed initial users if they don't exist
    if (typeof window !== 'undefined' && !localStorage.getItem('samarth_furniture_users')) {
      localStorage.setItem('samarth_furniture_users', JSON.stringify(initialUsers));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const users: User[] = JSON.parse(localStorage.getItem('samarth_furniture_users') || '[]');
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('loggedInUser', user.username);
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
        description: "Invalid username or password. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="inline-block rounded-lg bg-primary/20 p-3 text-primary">
            <Armchair className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Login to Samarth Furniture</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. owner"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
