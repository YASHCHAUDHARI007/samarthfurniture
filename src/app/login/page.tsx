
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
import type { User } from "@/lib/types";

const USERS_STORAGE_KEY = "samarth_furniture_users";

const initialUsers: User[] = [
  { username: "owner", password: "password123", role: "owner" },
  { username: "coordinator", password: "password456", role: "coordinator" },
  { username: "factory", password: "password789", role: "factory" },
  { username: "admin", password: "password", role: "administrator" },
];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    let allowedUsers: User[] = initialUsers;
    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (savedUsers) {
        allowedUsers = JSON.parse(savedUsers);
      } else {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      }
    }

    const user = allowedUsers.find(
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
