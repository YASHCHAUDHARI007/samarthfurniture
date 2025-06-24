
"use client";

import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
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
import { Trash2 } from "lucide-react";
import type { Order, Product } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";


type OrderItem = {
  id: string;
  quantity: number;
};

export default function DealerOrderPage() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();
  
  const [productCatalog, setProductCatalog] = useState<Product[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);

  const [newItemName, setNewItemName] = useState("");
  const [newItemSku, setNewItemSku] = useState("");


  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "factory" || role === "administrator") {
      setCanEdit(true);
    }

    const fetchCatalog = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "productCatalog"));
            const catalog = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id })) as Product[];
            setProductCatalog(catalog);
        } catch (error) {
            console.error("Error fetching product catalog: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch product catalog."})
        }
    }
    fetchCatalog();
  }, []);

  const handleCheckboxChange = (
    productId: string,
    checked: boolean | "indeterminate"
  ) => {
    if (checked) {
      setOrderItems([...orderItems, { id: productId, quantity: 1 }]);
    } else {
      setOrderItems(orderItems.filter((item) => item.id !== productId));
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const itemExists = orderItems.some((item) => item.id === productId);
    if (!itemExists) return;

    setOrderItems(
      orderItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const dealerName = formData.get("dealerName") as string;
    const dealerId = formData.get("dealerId") as string;

    if (orderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No Items Selected",
        description: "Please select at least one product for the order.",
      });
      return;
    }

    const orderDescription = orderItems
      .filter((item) => item.quantity > 0)
      .map((item) => {
        const product = productCatalog.find((p) => p.id === item.id);
        return `${item.quantity}x ${product?.name} (SKU: ${product?.sku})`;
      })
      .join("\n");

    if (!orderDescription) {
      toast({
        variant: "destructive",
        title: "No Quantities Specified",
        description: "Please specify a quantity for the selected items.",
      });
      return;
    }

    const summary = `${orderItems.reduce((acc, item) => acc + item.quantity, 0)} total units`;
    
    const loggedInUser = localStorage.getItem("loggedInUser");

    const newOrder: Omit<Order, 'id'> = {
      customer: dealerName,
      item: `Bulk Order: ${summary}`,
      status: "Pending",
      type: "Dealer",
      details: orderDescription,
      createdBy: loggedInUser || undefined,
      createdAt: new Date().toISOString(),
      customerInfo: {
        name: dealerName,
        dealerId: dealerId,
      },
    };

    try {
        const docRef = await addDoc(collection(db, "orders"), newOrder);
        await updateDoc(docRef, { id: docRef.id });
        toast({
            title: "Dealer Order Placed!",
            description: "The bulk order has been sent to the factory.",
        });
        setOrderItems([]);
        (e.target as HTMLFormElement).reset();
    } catch (error) {
        console.error("Error placing order: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not place the order." });
    }
  };

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newItemName || !newItemSku) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide both a name and SKU." });
      return;
    }

    try {
        const q = query(collection(db, "productCatalog"), where("sku", "==", newItemSku.toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            toast({ variant: "destructive", title: "SKU Exists", description: "A product with this SKU already exists." });
            return;
        }

        const newProduct: Omit<Product, "id"> = {
          name: newItemName,
          sku: newItemSku,
          image: "https://placehold.co/100x100.png",
          aiHint: "product " + newItemName.split(" ")[0]?.toLowerCase(),
        };

        const docRef = await addDoc(collection(db, "productCatalog"), newProduct);
        const productWithId = {...newProduct, id: docRef.id};
        await updateDoc(docRef, { id: docRef.id });

        setProductCatalog([...productCatalog, productWithId]);
        toast({ title: "Product Added", description: `${newItemName} has been added to the catalog.` });
        setNewItemName("");
        setNewItemSku("");
    } catch (error) {
        console.error("Error adding product: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not add product." });
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
        await deleteDoc(doc(db, "productCatalog", itemToDelete.id));
        setProductCatalog(productCatalog.filter((p) => p.id !== itemToDelete.id));
        toast({
          title: "Product Deleted",
          description: `${itemToDelete.name} has been removed from the catalog.`,
          variant: "destructive",
        });
        setItemToDelete(null);
    } catch (error) {
        console.error("Error deleting product: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete product." });
    }
  };

  const isProductSelected = (productId: string) => {
    return orderItems.some((item) => item.id === productId);
  };

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">New Dealer Order</h2>
      <p className="text-muted-foreground">
        Create a new bulk order for a registered dealer.
      </p>
      <Separator />

      {canEdit && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Manage Product Catalog</CardTitle>
              <CardDescription>
                Add or remove products from the catalog. These changes will be reflected for all users creating dealer orders.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddItem}>
              <CardContent className="space-y-4">
                 <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newItemName">Product Name</Label>
                    <Input
                      id="newItemName"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="e.g. Modern Bookshelf"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newItemSku">SKU</Label>
                    <Input
                      id="newItemSku"
                      value={newItemSku}
                      onChange={(e) => setNewItemSku(e.target.value)}
                      placeholder="e.g. BKS-MOD-WHT"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Add Product to Catalog</Button>
              </CardFooter>
            </form>
          </Card>
        )}

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dealer Information</CardTitle>
            <CardDescription>
              Enter the dealer's information for this bulk order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dealerName">Dealer Name</Label>
                <Input
                  id="dealerName"
                  name="dealerName"
                  placeholder="e.g. Modern Furnishings Co."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealerId">Dealer ID</Label>
                <Input
                  id="dealerId"
                  name="dealerId"
                  placeholder="e.g. DEALER-12345"
                  required
                />
              </div>
            </div>

            <Separator />

            <CardTitle className="pt-4">Product Catalog</CardTitle>
            <CardDescription>
              Select products and specify quantities for the order.
            </CardDescription>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="w-[120px]">Quantity</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCatalog.length > 0 ? productCatalog.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          id={`select-${product.id}`}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(product.id, checked)
                          }
                          checked={isProductSelected(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-md"
                            data-ai-hint={product.aiHint}
                          />
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          defaultValue={1}
                          disabled={!isProductSelected(product.id)}
                          onChange={(e) =>
                            handleQuantityChange(
                              product.id,
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                       {canEdit && (
                        <TableCell className="text-right">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={(e) => { e.preventDefault(); setItemToDelete(product); }}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Item</span>
                            </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={canEdit ? 5: 4} className="h-24 text-center">No products in catalog. Add one above.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Place Bulk Order</Button>
          </CardFooter>
        </Card>
      </form>
    </div>

    <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product
                <span className="font-semibold"> {itemToDelete?.name} </span>
                from the catalog.
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
