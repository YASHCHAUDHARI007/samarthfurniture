"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Warehouse, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

type StockItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  status: StockStatus;
};

const initialStock: StockItem[] = [
  { id: "prod_001", name: "Modular 'L' Sofa", sku: "SOF-MOD-L-GRY", quantity: 25, reorderLevel: 10, status: "In Stock" },
  { id: "prod_002", name: "Minimalist Oak Desk", sku: "DSK-OAK-MIN-150", quantity: 8, reorderLevel: 15, status: "Low Stock" },
  { id: "prod_003", name: "Floating Wall Shelf", sku: "SHL-WAL-FLT-WHT", quantity: 120, reorderLevel: 50, status: "In Stock" },
  { id: "prod_004", name: "Upholstered Dining Chair", sku: "CHR-DIN-UPH-BGE", quantity: 0, reorderLevel: 20, status: "Out of Stock" },
  { id: "prod_005", name: "Velvet Upholstered Armchair", sku: "CHR-ARM-VLT-BLU", quantity: 12, reorderLevel: 10, status: "In Stock" },
];

export default function StockTurnoverPage() {
  const { toast } = useToast();
  const [stock, setStock] = useState<StockItem[]>(initialStock);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [newItemName, setNewItemName] = useState("");
  const [newItemSku, setNewItemSku] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemReorderLevel, setNewItemReorderLevel] = useState("");

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser?.includes("factory")) {
      setUserRole("factory");
    }
  }, []);

  const getStatus = (quantity: number, reorderLevel: number): StockStatus => {
    if (quantity === 0) return "Out of Stock";
    if (quantity > 0 && quantity <= reorderLevel) return "Low Stock";
    return "In Stock";
  };

  const getStatusBadgeVariant = (status: StockStatus): BadgeProps["variant"] => {
    switch (status) {
      case "In Stock":
        return "success";
      case "Low Stock":
        return "secondary";
      case "Out of Stock":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const quantity = parseInt(newItemQuantity, 10);
    const reorderLevel = parseInt(newItemReorderLevel, 10);

    if (
      !newItemName ||
      !newItemSku ||
      isNaN(quantity) ||
      isNaN(reorderLevel) ||
      quantity < 0 ||
      reorderLevel < 0
    ) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please fill out all fields with valid information.",
      });
      return;
    }

    const newItem: StockItem = {
      id: `prod_${Date.now()}`,
      name: newItemName,
      sku: newItemSku,
      quantity,
      reorderLevel,
      status: getStatus(quantity, reorderLevel),
    };

    setStock([...stock, newItem]);
    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to the stock.`,
    });

    setNewItemName("");
    setNewItemSku("");
    setNewItemQuantity("");
    setNewItemReorderLevel("");
  };

  const totalUnits = stock.reduce((acc, item) => acc + item.quantity, 0);
  const uniqueProducts = stock.filter((item) => item.quantity > 0).length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <Warehouse className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Stock Levels</h2>
      </div>
      <p className="text-muted-foreground">
        View and manage current inventory levels.
      </p>
      <Separator />

      {userRole === "factory" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Add New Stock Item</CardTitle>
            <CardDescription>
              Fill in the details to add a new product to the inventory.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddItem}>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Product Name</Label>
                  <Input
                    id="itemName"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Modern Sofa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemSku">SKU</Label>
                  <Input
                    id="itemSku"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    placeholder="e.g. SOF-MOD-BLU"
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemQuantity">Quantity</Label>
                  <Input
                    id="itemQuantity"
                    type="number"
                    min="0"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemReorderLevel">Reorder Level</Label>
                  <Input
                    id="itemReorderLevel"
                    type="number"
                    min="0"
                    value={newItemReorderLevel}
                    onChange={(e) => setNewItemReorderLevel(e.target.value)}
                    placeholder="e.g. 10"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Add Item</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1 pt-4 max-w-xs">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items in Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits} Units</div>
            <p className="text-xs text-muted-foreground">
              Across {uniqueProducts} unique products
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
          <CardDescription>
            A detailed list of all products in stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.reorderLevel}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
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
