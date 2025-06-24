
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
import { Wrench } from "lucide-react";
import type { RawMaterial } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function RawMaterialsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
  }, []);

  const getCompanyStorageKey = (baseKey: string) => {
    if (!activeCompanyId) return null;
    return `samarth_furniture_${activeCompanyId}_${baseKey}`;
  };
  
  useEffect(() => {
    if (!activeCompanyId) {
        setMaterials([]);
        return;
    }
    const materialsKey = getCompanyStorageKey('raw_materials')!;
    const storedMaterials = localStorage.getItem(materialsKey);
    if (storedMaterials) {
      setMaterials(JSON.parse(storedMaterials));
    } else {
      const initialMaterials: RawMaterial[] = [
        { id: 'raw-1', name: 'Plywood 18mm', quantity: 100, unit: 'sheets' },
        { id: 'raw-2', name: 'Laminate Sheen', quantity: 50, unit: 'sheets' },
        { id: 'raw-3', name: 'Screws 2-inch', quantity: 2000, unit: 'pieces' },
      ];
      localStorage.setItem(materialsKey, JSON.stringify(initialMaterials));
      setMaterials(initialMaterials);
    }
  }, [activeCompanyId]);
  
  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeCompanyId) return;

    if (!newItemName || !newItemUnit) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please fill out all fields.",
      });
      return;
    }
    
    if (materials.some(m => m.name.toLowerCase() === newItemName.toLowerCase())) {
        toast({
            variant: "destructive",
            title: "Item Exists",
            description: "A raw material with this name already exists.",
        });
        return;
    }

    const newItem: RawMaterial = {
      id: `raw-${new Date().getTime()}`,
      name: newItemName,
      quantity: 0, // New materials start with 0 quantity
      unit: newItemUnit,
    };

    const updatedMaterials = [...materials, newItem];
    setMaterials(updatedMaterials);
    const materialsKey = getCompanyStorageKey('raw_materials')!;
    localStorage.setItem(materialsKey, JSON.stringify(updatedMaterials));
    toast({
      title: "Material Type Added",
      description: `${newItem.name} has been added. Use the Purchases page to add stock.`,
    });
    setNewItemName("");
    setNewItemUnit("");
  };
  
  const canEdit = userRole === "factory" || userRole === "administrator" || userRole === "owner";

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
        <h2 className="text-3xl font-bold tracking-tight">Raw Materials</h2>
      </div>
      <p className="text-muted-foreground">
        View and manage raw material inventory.
      </p>
      <Separator />
      
      {canEdit && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Add New Material Type</CardTitle>
            <CardDescription>
              Add a new type of material to the inventory list. To add stock quantity for a material, please create a new entry on the Purchases page.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddItem}>
          <CardContent className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
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
            </CardContent>
            <CardFooter className="gap-4">
              <Button type="submit">Add New Material Type</Button>
              <Button variant="secondary" type="button" onClick={() => router.push('/purchases')}>Go to Purchases</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Material Stock</CardTitle>
          <CardDescription>
            A read-only list of all raw materials. To update quantities, create a Purchase entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length > 0 ? materials.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">No raw materials found.</TableCell>
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
