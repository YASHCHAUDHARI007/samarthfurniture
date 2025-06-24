
"use client";

import { useState, useEffect } from "react";
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
import type { Order, Contact } from "@/lib/types";

export default function CustomerOrderPage() {
  const { toast } = useToast();
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();
  
  const [allCustomers, setAllCustomers] = useState<Contact[]>([]);
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");


  useEffect(() => {
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem('samarth_furniture_contacts') || '[]');
    setAllCustomers(storedContacts.filter(c => c.type === 'Customer'));
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);

    if (value.length > 1) {
      const filtered = allCustomers.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectCustomer = (customer: Contact) => {
    setCustomerName(customer.name);
    setCustomerEmail(customer.email || "");
    setShippingAddress(customer.address || "");
    setSuggestions([]);
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const orderDetails = formData.get("details") as string;
    const height = formData.get("height") as string;
    const width = formData.get("width") as string;
    const depth = formData.get("depth") as string;
    const dimensionDetails = formData.get("dimensionDetails") as string;
    
    if (!customerName || !customerEmail || !shippingAddress) {
      toast({ variant: "destructive", title: "Missing Customer Info", description: "Please fill in all customer details."});
      return;
    }

    const loggedInUser = localStorage.getItem("loggedInUser");

    // Save or update customer ledger
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem('samarth_furniture_contacts') || '[]');
    let customer = storedContacts.find(c => c.name.toLowerCase() === customerName.toLowerCase() && c.type === 'Customer');
    let customerId = '';
    
    if (!customer) {
        customerId = `CUST-${Date.now()}`;
        customer = {
            id: customerId,
            name: customerName,
            type: 'Customer',
            email: customerEmail,
            address: shippingAddress,
        };
        const updatedContacts = [...storedContacts, customer];
        localStorage.setItem('samarth_furniture_contacts', JSON.stringify(updatedContacts));
        setAllCustomers(updatedContacts.filter(c => c.type === 'Customer'));
    } else {
        customerId = customer.id;
        if (customer.email !== customerEmail || customer.address !== shippingAddress) {
            customer.email = customerEmail;
            customer.address = shippingAddress;
            const updatedContacts = storedContacts.map(c => c.id === customer!.id ? customer : c);
            localStorage.setItem('samarth_furniture_contacts', JSON.stringify(updatedContacts));
            setAllCustomers(updatedContacts.filter(c => c.type === 'Customer'));
        }
    }

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
        id: customerId,
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
    setCustomerName("");
    setCustomerEmail("");
    setShippingAddress("");
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
                <div className="relative">
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Jane Doe"
                    required
                    value={customerName}
                    onChange={handleNameChange}
                    onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                    autoComplete="off"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                      <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                        {suggestions.map(customer => (
                          <Button
                            key={customer.id}
                            type="button"
                            variant="ghost"
                            className="justify-start"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            {customer.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Customer Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. jane.doe@example.com"
                  required
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
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
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
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
