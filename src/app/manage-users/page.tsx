
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Users, ShieldAlert } from "lucide-react";

// In a real application, this would come from a database or a secure backend.
// For this demo, we'll start with the same list as the login page.
const initialUsers = [
  { email: "owner@furnishflow.com", password: "password123" },
  { email: "coordinator@furnishflow.com", password: "password456" },
  { email: "factory@furnishflow.com", password: "password789" },
];

export default function ManageUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState(initialUsers);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser === "owner@furnishflow.com") {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }
    setIsLoading(false);
  }, []);
  
  const getUserRole = (email: string) => {
      if (email.includes("owner")) return "Owner";
      if (email.includes("coordinator")) return "Coordinator";
      if (email.includes("factory")) return "Factory Worker";
      return "User";
  }

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please enter both email and password.",
        });
        return;
    }

    if (users.some(user => user.email === newUserEmail)) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "A user with this email already exists.",
        });
        return;
    }

    setUsers([
      ...users,
      { email: newUserEmail, password: newUserPassword },
    ]);

    toast({
      title: "User Added",
      description: `User ${newUserEmail} has been added to the list.`,
    });

    setNewUserEmail("");
    setNewUserPassword("");
  };

  if (isLoading) {
      return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/> Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You do not have permission to view this page. Please contact the administrator.</p>
            </CardContent>
            <CardFooter>
                <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
            </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <Users className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Manage Users</h2>
      </div>
      <p className="text-muted-foreground">
        Add or remove users from the application.
      </p>
      <Separator />

      <Alert className="mt-4">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Developer Note</AlertTitle>
        <AlertDescription>
          This is a demonstration page. Users added here are not persisted and
          will not be able to log in. The user list will reset on page refresh.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-8 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
            <CardDescription>
              Create a new user account.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddUser}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUserEmail">Email</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  placeholder="new.user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUserPassword">Password</Label>
                <Input
                  id="newUserPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Add User</Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Users</CardTitle>
            <CardDescription>A list of all users in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.email}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{getUserRole(user.email)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
