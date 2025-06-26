
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
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const seedInitialUsers = async () => {
      const { data: users, error } = await supabase.from('users').select('id', { count: 'exact' });

      if(error) {
        console.error("Error checking for users:", error);
        // This might fail if the table doesn't exist yet on first run of a new Supabase project.
        // The user should ensure the 'users' table is created via Supabase Studio.
        toast({ variant: "destructive", title: "Database Error", description: "Could not connect to the users table. Please ensure it exists."});
        return;
      }

      if (users && users.length === 0) {
        console.log("No users found, seeding initial accounts...");
        const initialUsers: Omit<User, 'id'>[] = [
          { username: "owner", password: "password123", role: "owner" },
          { username: "coordinator", password: "password456", role: "coordinator" },
          { username: "factory", password: "password789", role: "factory" },
          { username: "admin", password: "password", role: "administrator" },
        ];
        
        const { error: insertError } = await supabase.from('users').insert(initialUsers);
        if (insertError) {
          console.error("Failed to seed initial users:", insertError);
          toast({ variant: "destructive", title: "Database setup error", description: "Could not create initial user accounts. Please check your Supabase connection and table schema." });
        } else {
           console.log("Initial users seeded successfully.");
           toast({ title: "Setup Complete", description: "Default user accounts have been created." });
        }
      }
    }
    seedInitialUsers();
  }, [toast]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !user) {
       toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid username or password. Please try again.",
      });
      setIsSubmitting(false);
      return;
    }

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
