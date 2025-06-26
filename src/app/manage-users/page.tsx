
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, ShieldAlert, Trash2 } from "lucide-react";
import type { User, UserRole } from "@/lib/types";
import { supabase } from "@/lib/supabase";


const roleDisplayNames: Record<UserRole, string> = {
  owner: "Owner",
  coordinator: "Coordinator",
  factory: "Factory Worker",
  administrator: "Administrator",
};

export default function ManageUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("coordinator");
  
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const username = localStorage.getItem("loggedInUser");
    setCurrentUserRole(role);
    setCurrentUsername(username);

    if (role === "owner" || role === "administrator") {
      setHasAccess(true);
      fetchUsers();
    } else {
        setIsLoading(false);
    }
  }, []);

  const fetchUsers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching users', description: error.message });
      } else {
        setUsers(data || []);
      }
      setIsLoading(false);
    };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newUserName || !newUserPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both username and password.",
      });
      return;
    }

    const { data: existingUser } = await supabase.from('users').select('id').eq('username', newUserName).single();
    if (existingUser) {
      toast({
            variant: "destructive",
            title: "Error",
            description: "A user with this username already exists.",
        });
        return;
    }

    const newUser: Omit<User, 'id'> = { 
        username: newUserName, 
        password: newUserPassword, 
        role: newUserRole 
    };

    const { data, error } = await supabase.from('users').insert(newUser).select().single();

    if (error) {
       toast({ variant: 'destructive', title: 'Error adding user', description: error.message });
    } else if (data) {
      setUsers([...users, data]);
      toast({
        title: "User Added",
        description: `User ${newUserName} has been added and can now log in.`,
      });
      setNewUserName("");
      setNewUserPassword("");
      setNewUserRole("coordinator");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    if (userToDelete.username === currentUsername || ['owner', 'admin'].includes(userToDelete.username)) {
      toast({ variant: "destructive", title: "Action Not Allowed" });
      setUserToDelete(null);
      return;
    }

    const { error } = await supabase.from('users').delete().eq('id', userToDelete.id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting user', description: error.message });
    } else {
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      toast({
        title: "User Deleted",
        description: `User account for ${userToDelete.username} has been removed.`,
        variant: "destructive"
      });
    }
    setUserToDelete(null);
  };

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="text-destructive" /> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              You do not have permission to view this page. Please contact the
              administrator.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
          <Users className="h-7 w-7" />
          <h2 className="text-3xl font-bold tracking-tight">Manage Users</h2>
        </div>
        <p className="text-muted-foreground">
          Add or remove users from the application.
        </p>
        <Separator />

        <div className="grid md:grid-cols-2 gap-8 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
              <CardDescription>
                Create a new user account with a specific role.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddUser}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newUserName">Username</Label>
                  <Input
                    id="newUserName"
                    type="text"
                    placeholder="e.g. new_coordinator"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
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
                <div className="space-y-2">
                  <Label htmlFor="newUserRole">Role</Label>
                  <Select
                    value={newUserRole}
                    onValueChange={(value) => setNewUserRole(value as UserRole)}
                  >
                    <SelectTrigger id="newUserRole">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="factory">Factory Worker</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="administrator">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
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
              <CardDescription>
                A list of all users in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      {currentUserRole === 'administrator' && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isSelf = user.username === currentUsername;
                      const isProtected = ['owner', 'admin'].includes(user.username);
                      const canDelete = currentUserRole === 'administrator' && !isSelf && !isProtected;

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{roleDisplayNames[user.role]}</TableCell>
                          {currentUserRole === 'administrator' && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setUserToDelete(user)}
                                disabled={!canDelete}
                                className={!canDelete ? "cursor-not-allowed text-muted-foreground/50" : "text-muted-foreground hover:text-destructive"}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete user</span>
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user account for
                    <span className="font-semibold"> {userToDelete?.username}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDeleteUser}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    Delete User
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
