
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
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, limit, writeBatch } from "firebase/firestore";

const initialUsers: Omit<User, "id">[] = [
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const seedInitialUsers = async () => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        console.log('No users found, seeding initial users...');
        const batch = writeBatch(db);
        initialUsers.forEach((user) => {
            const docRef = doc(usersRef); // Automatically generate ID
            batch.set(docRef, {...user, id: docRef.id});
        });
        await batch.commit();
        console.log("Initial users seeded.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await seedInitialUsers();

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const user = userDoc.data() as User;
        
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
    } catch (error) {
      console.error("Login Error: ", error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "An error occurred during login. Please check the console.",
      });
    } finally {
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
