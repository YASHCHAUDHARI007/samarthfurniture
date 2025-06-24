
"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Upload, Ruler } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/lib/types";

export default function CustomerOrderPage() {
  const { toast } = useToast();
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoDataUrl(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const customerName = formData.get("name") as string;
    const customerEmail = formData.get("email") as string;
    const shippingAddress = formData.get("address") as string;
    const orderDetails = formData.get("details") as string;
    const height = formData.get("height") as string;
    const width = formData.get("width") as string;
    const depth = formData.get("depth") as string;
    const dimensionDetails = formData.get("dimensionDetails") as string;
    
    const loggedInUser = localStorage.getItem("loggedInUser");

    const newOrder: Order = {
      id: `ORD-${new Date().getTime()}`,
      customer: customerName,
      item: `Custom: ${orderDetails.substring(0, 30)}...`,
      status: "Pending",
      type: "Customized",
      details: orderDetails,
      createdBy: loggedInUser || undefined,
      createdAt: new Date().toISOString(),
      dimensions: {
        height: height || undefined,
        width: width || undefined,
        depth: depth || undefined,
      },
      dimensionDetails: dimensionDetails || undefined,
      photoDataUrl: photoDataUrl,
      customerInfo: {
        name: customerName,
        email: customerEmail,
        address: shippingAddress,
      },
    };

    const existingOrders: Order[] = JSON.parse(
      localStorage.getItem("samarth_furniture_orders") || "[]"
    );
    localStorage.setItem(
      "samarth_furniture_orders",
      JSON.stringify([...existingOrders, newOrder])
    );

    toast({
      title: "Customized Order Submitted!",
      description: "The customized order has been sent to the factory.",
      variant: "default",
    });
    setPhotoDataUrl(undefined);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">New Customized Order</h2>
      <p className="text-muted-foreground">
        Create a new customized order for a customer. This information will be sent to the
        factory.
      </p>
      <Separator />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Customized Order Details</CardTitle>
            <CardDescription>
              Enter the customer's information and customized order specifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Customer Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. jane.doe@example.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Shipping Address</Label>
              <Textarea
                id="address"
                name="address"
                placeholder="e.g. 123 Main St, Anytown, USA 12345"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Order Details</Label>
              <Textarea
                id="details"
                name="details"
                placeholder="Describe the custom furniture, materials, colors, etc."
                rows={4}
                required
              />
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Design Photo</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photos">Upload Photo</Label>
                  <Input
                    id="photos"
                    name="photos"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a design sketch or inspiration photo.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Overall Dimensions</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (in)</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      placeholder="72"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (in)</Label>
                    <Input
                      id="width"
                      name="width"
                      type="number"
                      placeholder="36"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depth">Depth (in)</Label>
                    <Input
                      id="depth"
                      name="depth"
                      type="number"
                      placeholder="24"
                    />
                  </div>
                </div>
                 <div className="space-y-2 pt-2">
                    <Label htmlFor="dimensionDetails">Additional Measurement Details</Label>
                    <Textarea
                        id="dimensionDetails"
                        name="dimensionDetails"
                        placeholder="e.g. Left side shelf depth: 10in, Right side shelf depth: 12in. Clearance needed for baseboard: 1in."
                        rows={3}
                    />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Submit Customized Order</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
