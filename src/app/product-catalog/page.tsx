
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { useToast } from "@/hooks/use-toast";
import { GalleryVertical, ShieldAlert, Trash2 } from "lucide-react";
import type { CatalogItem } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";

export default function ProductCatalogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  // Form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemSku, setNewItemSku] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPhoto, setNewItemPhoto] = useState<string | undefined>();
  
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "owner" || role === "administrator") {
      setHasAccess(true);
    }
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
  }, []);
  
  useEffect(() => {
      if (!activeCompanyId) {
          setCatalogItems([]);
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      const itemsJson = localStorage.getItem(`catalog_items_${activeCompanyId}`);
      setCatalogItems(itemsJson ? JSON.parse(itemsJson) : []);
      setIsLoading(false);
  }, [activeCompanyId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newItemName || !newItemSku || !activeCompanyId) {
      toast({ variant: "destructive", title: "Missing Name or SKU" });
      return;
    }
    
    if (catalogItems.some(item => item.sku.toLowerCase() === newItemSku.toLowerCase())) {
        toast({ variant: "destructive", title: "Item exists", description: "A product with this SKU already exists in the catalog." });
        return;
    }

    const newItemId = `cat-${Date.now()}`;
    const newItem: CatalogItem = {
      id: newItemId,
      name: newItemName,
      sku: newItemSku,
      description: newItemDescription,
      photoDataUrl: newItemPhoto,
    };
    
    const updatedItems = [...catalogItems, newItem];
    setCatalogItems(updatedItems);
    localStorage.setItem(`catalog_items_${activeCompanyId}`, JSON.stringify(updatedItems));
    
    toast({ title: "Product Added", description: `${newItemName} has been added to the catalog.` });
    setNewItemName("");
    setNewItemSku("");
    setNewItemDescription("");
    setNewItemPhoto(undefined);
    (e.target as HTMLFormElement).reset();
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete || !activeCompanyId) return;

    const updatedItems = catalogItems.filter(item => item.id !== itemToDelete.id);
    setCatalogItems(updatedItems);
    localStorage.setItem(`catalog_items_${activeCompanyId}`, JSON.stringify(updatedItems));

    toast({ title: "Product Deleted", variant: "destructive" });
    setItemToDelete(null);
  };

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive" /> Access Denied</CardTitle>
          </CardHeader>
          <CardContent><p>You do not have permission to manage the product catalog.</p></CardContent>
          <CardFooter><Button onClick={() => router.push("/")}>Return to Dashboard</Button></CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!activeCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader><CardTitle>No Company Selected</CardTitle></CardHeader>
          <CardContent><p>Please select a company to manage the product catalog.</p></CardContent>
          <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
          <GalleryVertical className="h-7 w-7" />
          <h2 className="text-3xl font-bold tracking-tight">Product Catalog</h2>
        </div>
        <p className="text-muted-foreground">
          Create and manage the products available for dealer orders.
        </p>
        <Separator />

        <div className="grid md:grid-cols-3 gap-8 pt-4">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>Create a new product for your catalog.</CardDescription>
              </CardHeader>
              <form onSubmit={handleAddItem}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newItemName">Product Name</Label>
                    <Input id="newItemName" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required placeholder="e.g. Velvet Armchair" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newItemSku">SKU</Label>
                    <Input id="newItemSku" value={newItemSku} onChange={(e) => setNewItemSku(e.target.value)} required placeholder="e.g. ARM-VEL-01" />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="newItemDescription">Description (Optional)</Label>
                    <Textarea id="newItemDescription" value={newItemDescription} onChange={(e) => setNewItemDescription(e.target.value)} placeholder="e.g. A comfortable armchair with blue velvet upholstery." rows={3} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="newItemPhoto">Product Photo</Label>
                    <Input id="newItemPhoto" type="file" accept="image/*" onChange={handlePhotoChange} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Add Product</Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Catalog Products</CardTitle>
                <CardDescription>A list of all products in your catalog.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="rounded-md border">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {catalogItems.length > 0 ? catalogItems.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                <Image
                                    src={item.photoDataUrl || "https://placehold.co/64x64.png"}
                                    alt={item.name}
                                    width={64}
                                    height={64}
                                    className="rounded-md object-cover"
                                    data-ai-hint={`product ${item.name.split(" ")[0]?.toLowerCase()}`}
                                />
                                <span>{item.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell className="text-right space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setItemToDelete(item)}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </TableCell>
                        </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">No products created yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product <span className="font-semibold">{itemToDelete?.name}</span> from the catalog. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
