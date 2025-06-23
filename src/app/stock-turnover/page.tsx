"use client";

import {
  Card,
  CardContent,
  CardDescription,
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <Warehouse className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Stock Levels</h2>
      </div>
      <p className="text-muted-foreground">
        View current inventory levels.
      </p>
      <Separator />

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1 pt-4 max-w-xs">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items in Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">165 Units</div>
            <p className="text-xs text-muted-foreground">Across 4 unique products</p>
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
                {initialStock.map((item) => (
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
