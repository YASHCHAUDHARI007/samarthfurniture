"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, Printer, IndianRupee, ShieldAlert } from "lucide-react";
import type { Order, Purchase, Ledger } from "@/lib/types";

export default function GstReportsPage() {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);

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
        setIsLoading(false);
        return;
    };
    setIsLoading(true);

    const ordersJson = localStorage.getItem(`orders_${activeCompanyId}`);
    setOrders(ordersJson ? JSON.parse(ordersJson) : []);

    const purchasesJson = localStorage.getItem(`purchases_${activeCompanyId}`);
    setPurchases(purchasesJson ? JSON.parse(purchasesJson) : []);

    const ledgersJson = localStorage.getItem(`ledgers_${activeCompanyId}`);
    setLedgers(ledgersJson ? JSON.parse(ledgersJson) : []);

    setIsLoading(false);

  }, [activeCompanyId]);

  const { gstr1Data, gstr2Data, gstr3bSummary } = useMemo(() => {
    // GSTR-1 Data (Sales)
    const billedOrders = orders.filter(o => o.status === 'Billed' || o.status === 'Delivered');
    const gstr1Data = billedOrders.map(order => {
        const ledger = ledgers.find(c => c.id === order.customerInfo?.id);
        return {
            ...order,
            gstin: ledger?.gstin || 'N/A'
        };
    });

    // GSTR-2 Data (Purchases)
    const gstr2Data = purchases.map(purchase => {
        const ledger = ledgers.find(c => c.id === purchase.supplierId);
        return {
            ...purchase,
            gstin: ledger?.gstin || 'N/A'
        };
    });

    // GSTR-3B Summary
    const salesSummary = gstr1Data.reduce((acc, order) => {
        acc.taxableValue += order.subTotal || 0;
        acc.cgst += order.cgstAmount || 0;
        acc.sgst += order.sgstAmount || 0;
        acc.totalTax += order.totalGstAmount || 0;
        return acc;
    }, { taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0 });

    const purchaseSummary = gstr2Data.reduce((acc, purchase) => {
        acc.taxableValue += purchase.totalAmount || 0;
        return acc;
    }, { taxableValue: 0});

    const gstr3bSummary = {
        outward: salesSummary,
        inward: purchaseSummary,
        netTax: salesSummary.totalTax
    };

    return { gstr1Data, gstr2Data, gstr3bSummary };
  }, [orders, purchases, ledgers]);

  const handlePrint = () => window.print();

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
          <CardContent><p>You do not have permission to view GST reports.</p></CardContent>
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
          <CardContent><p>Please select a company to view GST reports.</p></CardContent>
          <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between no-print">
            <div>
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-7 w-7" />
                    <h2 className="text-3xl font-bold tracking-tight">GST Reports</h2>
                </div>
                <p className="text-muted-foreground">
                    Generate reports for GSTR-1, GSTR-2, and GSTR-3B filings.
                </p>
            </div>
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print Reports</Button>
        </div>
        <Separator className="no-print" />

        <div id="printable-area">
        <Tabs defaultValue="gstr1" className="pt-4">
            <TabsList className="grid w-full grid-cols-3 max-w-lg no-print">
                <TabsTrigger value="gstr1">GSTR-1 (Sales)</TabsTrigger>
                <TabsTrigger value="gstr2">GSTR-2 (Purchases)</TabsTrigger>
                <TabsTrigger value="gstr3b">GSTR-3B (Summary)</TabsTrigger>
            </TabsList>

            <TabsContent value="gstr1">
                <Card className="mt-2">
                    <CardHeader>
                        <CardTitle>GSTR-1: Outward Supplies (Sales)</CardTitle>
                        <CardDescription>Details of all sales invoices issued during the period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Recipient GSTIN</TableHead>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Invoice Date</TableHead>
                                    <TableHead className="text-right">Invoice Value</TableHead>
                                    <TableHead className="text-right">Taxable Value</TableHead>
                                    <TableHead className="text-right">CGST</TableHead>
                                    <TableHead className="text-right">SGST</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gstr1Data.length > 0 ? gstr1Data.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>{order.gstin}</TableCell>
                                    <TableCell>{order.invoiceNumber}</TableCell>
                                    <TableCell>{order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString() : ''}</TableCell>
                                    <TableCell className="text-right font-mono">₹{order.totalAmount?.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono">₹{order.subTotal?.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono">₹{order.cgstAmount?.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono">₹{order.sgstAmount?.toFixed(2)}</TableCell>
                                </TableRow>
                                )) : (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center">No sales data for this period.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="gstr2">
                <Card className="mt-2">
                    <CardHeader>
                        <CardTitle>GSTR-2: Inward Supplies (Purchases)</CardTitle>
                        <CardDescription>Details of all purchases made during the period. Tax breakdown not available.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Supplier GSTIN</TableHead>
                                    <TableHead>Supplier Name</TableHead>
                                    <TableHead>Bill #</TableHead>
                                    <TableHead>Bill Date</TableHead>
                                    <TableHead className="text-right">Bill Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gstr2Data.length > 0 ? gstr2Data.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.gstin}</TableCell>
                                    <TableCell>{p.supplierName}</TableCell>
                                    <TableCell>{p.billNumber}</TableCell>
                                    <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right font-mono">₹{p.totalAmount.toFixed(2)}</TableCell>
                                </TableRow>
                                )) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No purchase data for this period.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="gstr3b">
                <Card className="mt-2">
                    <CardHeader>
                        <CardTitle>GSTR-3B: Consolidated Summary</CardTitle>
                        <CardDescription>Summary of sales and purchases for tax computation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-lg">3.1 Details of Outward Supplies (Sales)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                     <div className="flex justify-between"><span>Total Taxable Value:</span> <span className="font-mono font-semibold">₹{gstr3bSummary.outward.taxableValue.toFixed(2)}</span></div>
                                     <div className="flex justify-between"><span>Total CGST:</span> <span className="font-mono font-semibold">₹{gstr3bSummary.outward.cgst.toFixed(2)}</span></div>
                                     <div className="flex justify-between"><span>Total SGST:</span> <span className="font-mono font-semibold">₹{gstr3bSummary.outward.sgst.toFixed(2)}</span></div>
                                     <Separator className="my-2"/>
                                     <div className="flex justify-between font-bold"><span>Total Tax:</span> <span className="font-mono">₹{gstr3bSummary.outward.totalTax.toFixed(2)}</span></div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-lg">4.0 Eligible ITC (Purchases)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                     <div className="flex justify-between"><span>Total Purchase Value:</span> <span className="font-mono font-semibold">₹{gstr3bSummary.inward.taxableValue.toFixed(2)}</span></div>
                                     <p className="text-xs text-muted-foreground pt-2">Note: This is the total value of bills. Input Tax Credit (ITC) must be calculated based on tax components from actual purchase invoices.</p>
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="bg-primary/10 border-primary/50">
                             <CardHeader>
                                <CardTitle className="text-lg">5.0 Net Tax Payable</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between font-bold text-xl">
                                    <span>Tax from Sales (CGST + SGST):</span> 
                                    <div className="flex items-center font-mono">
                                        <IndianRupee className="h-5 w-5 mr-1" />
                                        <span>{gstr3bSummary.netTax.toFixed(2)}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground pt-2">Net payable is calculated as Total Tax from Sales minus Eligible ITC. Please calculate final ITC manually.</p>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        </div>
      </div>
    </>
  );
}
