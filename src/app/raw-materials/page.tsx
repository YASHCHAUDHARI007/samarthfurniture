
"use client";

import { useEffect, useState } from "react";
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
import { Wrench, ShieldAlert } from "lucide-react";
import type { RawMaterial, Location } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RawMaterialsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemLocationId, setNewItemLocationId] = useState("");
  
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    if (role === "owner" || role === "factory" || role === "administrator") {
      setHasAccess(true);
    }
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
    setIsLoading(false);
  }, []);

  const getCompanyStorageKey = (baseKey: string) => {
    if (!activeCompanyId) return null;
    return `samarth_furniture_${activeCompanyId}_${baseKey}`;
  };
  
  useEffect(() => {
    if (!activeCompanyId) {
        setMaterials([]);
        setLocations([]);
        return;
    }
    const materialsKey = getCompanyStorageKey('raw_materials')!;
    const storedMaterials = localStorage.getItem(materialsKey);
    setMaterials(storedMaterials ? JSON.parse(storedMaterials) : []);
    
    const locationsKey = getCompanyStorageKey('locations')!;
    const storedLocations = localStorage.getItem(locationsKey);
    setLocations(storedLocations ? JSON.parse(storedLocations) : []);

  }, [activeCompanyId]);
  
  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeCompanyId || !newItemName || !newItemUnit || !newItemLocationId) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please fill out all fields.",
      });
      return;
    }
    
    if (materials.some(m => m.name.toLowerCase() === newItemName.toLowerCase() && m.locationId === newItemLocationId)) {
        toast({
            variant: "destructive",
            title: "Item Exists",
            description: "This raw material already exists at this location.",
        });
        return;
    }
    
    const location = locations.find(loc => loc.id === newItemLocationId);
    if (!location) return;

    const newItem: RawMaterial = {
      id: `raw-${new Date().getTime()}`,
      name: newItemName,
      quantity: parseInt(newItemQuantity, 10) || 0,
      unit: newItemUnit,
      locationId: newItemLocationId,
      locationName: location.name,
    };

    const updatedMaterials = [...materials, newItem];
    setMaterials(updatedMaterials);
    const materialsKey = getCompanyStorageKey('raw_materials')!;
    localStorage.setItem(materialsKey, JSON.stringify(updatedMaterials));
    toast({
      title: "Material Added",
      description: `${newItem.name} has been added. Use the Purchases page to add more stock.`,
    });
    setNewItemName("");
    setNewItemUnit("");
    setNewItemQuantity("");
    setNewItemLocationId("");
  };
  
  const canEdit = userRole === "factory" || userRole === "administrator" || userRole === "owner";

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
          <CardContent><p>You do not have permission to view this page.</p></CardContent>
          <CardFooter><Button onClick={() => router.push("/")}>Return to Dashboard</Button></CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!activeCompanyId) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Company Selected</CardTitle>
            </CardHeader>
            <CardContent><p>Please select or create a company to manage raw materials.</p></CardContent>
            <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
          </Card>
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <Wrench className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Raw Material Stock</h2>
      </div>
      <p className="text-muted-foreground">
        Manage stock levels for raw materials across different locations.
      </p>
      <Separator />
      
      {canEdit && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Add New Material Stock</CardTitle>
            <CardDescription>
              Add a new raw material with its initial quantity at a specific location. To add more stock later, use the Purchases page.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddItem}>
          <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Material Name</Label>
                  <Input
                    id="itemName"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Oak Wood Planks"
                    required
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="itemUnit">Unit</Label>
                  <Input
                    id="itemUnit"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="e.g. planks, units, liters"
                    required
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="itemQuantity">Initial Quantity</Label>
                  <Input
                    id="itemQuantity"
                    type="number"
                    min="0"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="e.g. 100"
                    required
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="itemLocation">Location</Label>
                   <Select value={newItemLocationId} onValueChange={setNewItemLocationId} required>
                      <SelectTrigger id="itemLocation"><SelectValue placeholder="Select a location..." /></SelectTrigger>
                      <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
            </CardContent>
            <CardFooter className="gap-4">
              <Button type="submit">Add New Material</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Material Stock</CardTitle>
          <CardDescription>
            A read-only list of all raw materials across all locations. To update quantities, create a Purchase entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length > 0 ? materials.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.locationName || 'N/A'}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No raw materials found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
