
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
import { Warehouse, ShieldAlert, Trash2 } from "lucide-react";
import type { Location } from "@/lib/types";

export default function ManageLocationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");

  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "owner" || role === "administrator") {
      setHasAccess(true);
    }
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
  }, []);
  
  useEffect(() => {
      if (!activeCompanyId) {
          setLocations([]);
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      const locationsKey = `samarth_furniture_${activeCompanyId}_locations`;
      const storedLocations = JSON.parse(localStorage.getItem(locationsKey) || '[]');
      setLocations(storedLocations);
      setIsLoading(false);
  }, [activeCompanyId]);


  const handleAddLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newLocationName || !activeCompanyId) {
      toast({ variant: "destructive", title: "Missing Name" });
      return;
    }
    
    if (locations.some(loc => loc.name.toLowerCase() === newLocationName.toLowerCase())) {
        toast({ variant: "destructive", title: "Location exists", description: "A location with this name already exists." });
        return;
    }

    const newLocation: Location = {
      id: `LOC-${Date.now()}`,
      name: newLocationName,
      address: newLocationAddress || undefined,
    };
    const updatedLocations = [...locations, newLocation];
    setLocations(updatedLocations);
    
    const locationsKey = `samarth_furniture_${activeCompanyId}_locations`;
    localStorage.setItem(locationsKey, JSON.stringify(updatedLocations));
    
    toast({ title: "Location Created", description: `${newLocationName} has been created successfully.` });
    setNewLocationName("");
    setNewLocationAddress("");
  };

  const handleDeleteLocation = () => {
    if (!locationToDelete || !activeCompanyId) return;

    // TODO: Add check to prevent deleting a location if it has stock.
    
    const updatedLocations = locations.filter(c => c.id !== locationToDelete.id);
    setLocations(updatedLocations);
    
    const locationsKey = `samarth_furniture_${activeCompanyId}_locations`;
    localStorage.setItem(locationsKey, JSON.stringify(updatedLocations));
    
    toast({ title: "Location Deleted", variant: "destructive" });
    setLocationToDelete(null);
  };

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive" /> Access Denied</CardTitle>
          </CardHeader>
          <CardContent><p>You do not have permission to manage locations.</p></CardContent>
          <CardFooter><Button onClick={() => router.push("/")}>Return to Dashboard</Button></CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!activeCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader><CardTitle>No Company Selected</CardTitle></CardHeader>
          <CardContent><p>Please select a company to manage locations.</p></CardContent>
          <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
          <Warehouse className="h-7 w-7" />
          <h2 className="text-3xl font-bold tracking-tight">Manage Locations</h2>
        </div>
        <p className="text-muted-foreground">
          Create and manage different warehouses or stock locations.
        </p>
        <Separator />

        <div className="grid md:grid-cols-2 gap-8 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Location</CardTitle>
              <CardDescription>Create a new warehouse or stock location.</CardDescription>
            </CardHeader>
            <form onSubmit={handleAddLocation}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newLocationName">Location Name</Label>
                  <Input id="newLocationName" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} required placeholder="e.g. Main Warehouse" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newLocationAddress">Address (Optional)</Label>
                  <Input id="newLocationAddress" value={newLocationAddress} onChange={(e) => setNewLocationAddress(e.target.value)} placeholder="e.g. 123 Industrial Park" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Create Location</Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Locations</CardTitle>
              <CardDescription>A list of all warehouses and locations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.length > 0 ? locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell>{location.address || 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocationToDelete(location)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                         <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">No locations created yet.</TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!locationToDelete} onOpenChange={(isOpen) => !isOpen && setLocationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the location <span className="font-semibold">{locationToDelete?.name}</span>. This action cannot be undone. Make sure no stock is assigned to this location before deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLocation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
