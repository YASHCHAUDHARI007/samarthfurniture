
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

type RawMaterial = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

const initialMaterials: RawMaterial[] = [
  { id: "mat_001", name: "Oak Wood Planks", quantity: 200, unit: "planks" },
  { id: "mat_002", name: "Pine Wood Planks", quantity: 350, unit: "planks" },
  { id: "mat_003", name: "Steel Screws", quantity: 5000, unit: "units" },
  { id: "mat_004", name: "Wood Varnish", quantity: 50, unit: "liters" },
  { id: "mat_005", name: "Fabric Upholstery", quantity: 100, unit: "meters" },
];

export default function RawMaterialsPage() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<RawMaterial[]>(initialMaterials);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity < 0) {
      toast({
        variant: "destructive",
        title: "Invalid Quantity",
        description: "Please enter a valid non-negative number.",
      });
      return;
    }
    let materialName = "";
    let quantityChanged = false;
    
    setMaterials(
      materials.map((mat) => {
          if (mat.id === id) {
              materialName = mat.name;
              if (mat.quantity !== newQuantity) {
                   quantityChanged = true;
              }
              return { ...mat, quantity: newQuantity }
          }
          return mat
      })
    );

    if (quantityChanged) {
        toast({
            title: "Quantity Updated",
            description: `Stock for ${materialName} has been updated.`,
        });
    }
  };
  
  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const quantity = parseInt(newItemQuantity, 10);

    if (
      !newItemName ||
      !newItemUnit ||
      isNaN(quantity) ||
      quantity < 0
    ) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please fill out all fields with valid information.",
      });
      return;
    }
    
    if (materials.some(mat => mat.name.toLowerCase() === newItemName.toLowerCase())) {
        toast({
            variant: "destructive",
            title: "Item Exists",
            description: "A raw material with this name already exists.",
        });
        return;
    }

    const newItem: RawMaterial = {
      id: `mat_${Date.now()}`,
      name: newItemName,
      quantity,
      unit: newItemUnit,
    };

    setMaterials([...materials, newItem]);
    toast({
      title: "Material Added",
      description: `${newItem.name} has been added to the raw materials stock.`,
    });

    setNewItemName("");
    setNewItemQuantity("");
    setNewItemUnit("");
  };

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
      
      {userRole === "factory" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Add New Raw Material</CardTitle>
            <CardDescription>
              Add a new material to the inventory list.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddItem}>
          <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
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
                  <Label htmlFor="itemQuantity">Initial Quantity</Label>
                  <Input
                    id="itemQuantity"
                    type="number"
                    min="0"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="e.g. 200"
                    required
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="itemUnit">Unit</Label>
                  <Input
                    id="itemUnit"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="e.g. planks"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Add New Material</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Material Stock</CardTitle>
          <CardDescription>
            A detailed list of all raw materials. Factory workers can update quantities directly in the table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  {userRole === "factory" && <TableHead className="w-[150px]">Update Quantity</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    {userRole === "factory" && (
                        <TableCell>
                            <Input
                                type="number"
                                min="0"
                                defaultValue={item.quantity}
                                onBlur={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value, 10))}
                                className="w-24"
                            />
                        </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
