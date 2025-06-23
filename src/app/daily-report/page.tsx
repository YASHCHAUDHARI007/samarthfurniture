
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
import { ShieldAlert, ClipboardList, Package, Truck, Boxes, AlertTriangle } from "lucide-react";

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

type StockItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  status: StockStatus;
};

const lowStockItems: StockItem[] = [
  { id: "prod_002", name: "Minimalist Oak Desk", sku: "DSK-OAK-MIN-150", quantity: 8, reorderLevel: 15, status: "Low Stock" },
  { id: "prod_004", name: "Upholstered Dining Chair", sku: "CHR-DIN-UPH-BGE", quantity: 0, reorderLevel: 20, status: "Out of Stock" },
];

const recentActivities = [
    { time: "09:15 AM", description: "Order ORD-008 status changed to 'Working'." },
    { time: "10:30 AM", description: "New customer order placed by John Smith." },
    { time: "11:00 AM", description: "Material 'Pine Wood Planks' quantity updated to 300." },
    { time: "01:45 PM", description: "Order ORD-003 status changed to 'Delivered'." },
    { time: "03:20 PM", description: "Bulk order placed by 'Modern Furnishings Co.'." },
];

export default function DailyReportPage() {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "owner") {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }
    setCurrentDate(new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }));
    setIsLoading(false);
  }, []);

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

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (!isOwner) {
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
              You do not have permission to view this page. This page is for
              owners only.
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Daily Report</h2>
      </div>
      <p className="text-muted-foreground">
        Summary of operations for {currentDate}.
      </p>
      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Orders</CardTitle>
                  <Boxes className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                      8 Customer, 4 Dealer
                  </p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Productions</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">8</div>
                   <p className="text-xs text-muted-foreground">
                      For 5 different orders
                  </p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Items Shipped</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">4</div>
                   <p className="text-xs text-muted-foreground">
                      Total orders delivered
                  </p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">2</div>
                   <p className="text-xs text-muted-foreground">
                      Items need reordering
                  </p>
              </CardContent>
          </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8 pt-4">
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>A log of today's key events.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Time</TableHead>
                            <TableHead>Event</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentActivities.map((activity, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{activity.time}</TableCell>
                                <TableCell>{activity.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
             <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>Products that have fallen below their reorder level.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lowStockItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                     <Badge variant={getStatusBadgeVariant(item.status)}>
                                        {item.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
