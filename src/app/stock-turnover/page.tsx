
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
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Warehouse, Package, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { StockItem, StockStatus, Location } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StockTurnoverPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);

  const [newItemName, setNewItemName] = useState("");
  const [newItemSku, setNewItemSku] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemReorderLevel, setNewItemReorderLevel] = useState("");
  const [newItemLocationId, setNewItemLocationId] = useState("");

  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const getCompanyStorageKey = (baseKey: string) => {
    if (!activeCompanyId) return null;
    return `samarth_furniture_${activeCompanyId}_${baseKey}`;
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
  }, []);

  useEffect(() => {
    if (!activeCompanyId) {
        setStock([]);
        setLocations([]);
        return;
    }
    const stockKey = getCompanyStorageKey('stock_items')!;
    const storedStock = localStorage.getItem(stockKey);
    setStock(storedStock ? JSON.parse(storedStock) : []);
    
    const locationsKey = getCompanyStorageKey('locations')!;
    const storedLocations = localStorage.getItem(locationsKey);
    setLocations(storedLocations ? JSON.parse(storedLocations) : []);

  }, [activeCompanyId]);

  const getStatus = (quantity: number, reorderLevel: number): StockStatus => {
    if (quantity <= 0) return "Out of Stock";
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
    if (!activeCompanyId) return;

    const quantity = parseInt(newItemQuantity, 10);
    const reorderLevel = parseInt(newItemReorderLevel, 10);

    if (
      !newItemName ||
      !newItemSku ||
      !newItemLocationId ||
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

    if (stock.some(item => item.sku.toLowerCase() === newItemSku.toLowerCase() && item.locationId === newItemLocationId)) {
        toast({ variant: "destructive", title: "SKU already exists", description: "An item with this SKU already exists in this location."});
        return;
    }
    
    const location = locations.find(loc => loc.id === newItemLocationId);
    if (!location) return;

    const newItem: StockItem = {
      id: `stock-${new Date().getTime()}`,
      name: newItemName,
      sku: newItemSku,
      quantity,
      reorderLevel,
      status: getStatus(quantity, reorderLevel),
      locationId: newItemLocationId,
      locationName: location.name,
    };

    const updatedStock = [...stock, newItem];
    setStock(updatedStock);
    
    const stockKey = getCompanyStorageKey('stock_items')!;
    localStorage.setItem(stockKey, JSON.stringify(updatedStock));

    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to the stock.`,
    });
    setNewItemName("");
    setNewItemSku("");
    setNewItemQuantity("");
    setNewItemReorderLevel("");
    setNewItemLocationId("");
  };
  
  const handleDeleteItem = () => {
    if (!itemToDelete || !activeCompanyId) return;
    const updatedStock = stock.filter((s) => s.id !== itemToDelete.id);
    setStock(updatedStock);

    const stockKey = getCompanyStorageKey('stock_items')!;
    localStorage.setItem(stockKey, JSON.stringify(updatedStock));
    toast({
      title: "Item Deleted",
      description: `${itemToDelete.name} has been removed from the stock.`,
      variant: "destructive",
    });
    setItemToDelete(null);
  };


  const totalUnits = stock.reduce((acc, item) => acc + item.quantity, 0);
  const uniqueProducts = stock.filter((item) => item.quantity > 0).length;
  const canEdit = userRole === "factory" || userRole === "administrator" || userRole === "owner";
  
  if (!activeCompanyId) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Company Selected</CardTitle>
            </CardHeader>
            <CardContent><p>Please select or create a company to manage stock.</p></CardContent>
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
          <h2 className="text-3xl font-bold tracking-tight">Finished Product Stock</h2>
        </div>
        <p className="text-muted-foreground">
          View and manage finished goods inventory. Stock is automatically deducted for dealer orders upon completion.
        </p>
        <Separator />

        {canEdit && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add New Stock Item</CardTitle>
              <CardDescription>
                Fill in the details to add a new product to the inventory at a specific location.
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
                <div className="grid md:grid-cols-3 gap-4">
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
                   <div className="space-y-2">
                    <Label htmlFor="itemLocation">Location</Label>
                     <Select value={newItemLocationId} onValueChange={setNewItemLocationId} required>
                        <SelectTrigger id="itemLocation"><SelectValue placeholder="Select a location..." /></SelectTrigger>
                        <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Add Item</Button>
              </CardFooter>
            </form>
          </Card>
        )}

        <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-4">
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
              A detailed list of all finished products in stock across all locations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.length > 0 ? stock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.locationName || "N/A"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.reorderLevel}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => setItemToDelete(item)}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Item</span>
                            </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={canEdit ? 7: 6} className="h-24 text-center">No stock items found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the item
                    <span className="font-semibold"> {itemToDelete?.name} </span>
                    from the inventory at <span className="font-semibold">{itemToDelete?.locationName}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDeleteItem}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
