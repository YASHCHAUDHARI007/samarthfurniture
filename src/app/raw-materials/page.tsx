
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

const initialRawMaterials: RawMaterial[] = [
  { id: 'raw-1', name: "Oak Wood Planks", quantity: 200, unit: "planks" },
  { id: 'raw-2', name: "Steel Screws", quantity: 5000, unit: "units" },
  { id: 'raw-3', name: "White Paint", quantity: 50, unit: "liters" },
  { id: 'raw-4', name: "Varnish", quantity: 30, unit: "liters" },
];

export default function RawMaterialsPage() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    
    const storedMaterials = localStorage.getItem("samarth_furniture_raw_materials");
    if (storedMaterials) {
      setMaterials(JSON.parse(storedMaterials));
    } else {
      setMaterials(initialRawMaterials);
      localStorage.setItem("samarth_furniture_raw_materials", JSON.stringify(initialRawMaterials));
    }
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
    
    const materialToUpdate = materials.find(mat => mat.id === id);
    if (materialToUpdate && materialToUpdate.quantity !== newQuantity) {
      const updatedMaterials = materials.map((mat) =>
        mat.id === id ? { ...mat, quantity: newQuantity } : mat
      );
      setMaterials(updatedMaterials);
      localStorage.setItem("samarth_furniture_raw_materials", JSON.stringify(updatedMaterials));
      toast({
        title: "Quantity Updated",
        description: `Stock for ${materialToUpdate.name} has been updated.`,
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
      quantity,
      unit: newItemUnit,
    };

    const updatedMaterials = [...materials, newItem];
    setMaterials(updatedMaterials);
    localStorage.setItem(
      "samarth_furniture_raw_materials",
      JSON.stringify(updatedMaterials)
    );
    toast({
      title: "Material Added",
      description: `${newItem.name} has been added to the raw materials stock.`,
    });
    setNewItemName("");
    setNewItemQuantity("");
    setNewItemUnit("");
  };
  
  const canEdit = userRole === "factory" || userRole === "administrator";

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
            A detailed list of all raw materials. Factory workers or admins can update quantities directly in the table.
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
                  {canEdit && <TableHead className="w-[150px]">Update Quantity</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length > 0 ? materials.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    {canEdit && (
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
                )) : (
                    <TableRow>
                        <TableCell colSpan={canEdit ? 4 : 3} className="h-24 text-center">No raw materials found.</TableCell>
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
