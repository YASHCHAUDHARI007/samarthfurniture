
"use client";

import type { Order } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Armchair } from "lucide-react";

export const Invoice = ({ order }: { order: Order }) => (
    <div className="bg-white text-black p-8 w-full min-h-[297mm] mx-auto shadow-lg print:shadow-none relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
                <Armchair className="h-12 w-12 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Samarth Furniture</h1>
                    <p className="text-sm text-gray-500">123 Furniture Lane, Anytown, ST 12345</p>
                    <p className="text-sm text-gray-500">contact@samarthfurniture.com</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-semibold uppercase text-gray-700">Invoice</h2>
                <p className="text-sm">Invoice #: <span className="font-medium">{order.invoiceNumber}</span></p>
                <p className="text-sm">Date: <span className="font-medium">{order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString() : 'N/A'}</span></p>
                {order.reference && (<p className="text-sm">Ref: <span className="font-medium">{order.reference}</span></p>)}
            </div>
        </div>

        <Separator className="my-8" />

        {/* Billed To */}
        <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Billed To</h3>
            <p className="font-bold text-lg">{order.customerInfo?.name || order.customer}</p>
            <p className="text-sm break-words">{order.customerInfo?.address || "N/A"}</p>
            <p className="text-sm break-words">{order.customerInfo?.email || ""}</p>
        </div>

        {/* Order Summary Table */}
        <div className="mb-8">
            <Table>
                <TableHeader className="bg-gray-50 print:bg-gray-50">
                    <TableRow>
                        <TableHead className="w-[50%]">Item Description</TableHead>
                        <TableHead className="text-center w-[120px]">HSN/SAC</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {order.lineItems?.map(item => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-center">{item.hsn || ''}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{(item.quantity * item.price).toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
            <div className="w-full max-w-sm space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{order.subTotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">SGST ({((order.totalGstRate || 0) / 2).toFixed(2)}%)</span>
                    <span className="font-medium">₹{order.sgstAmount?.toFixed(2) || '0.00'}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">CGST ({((order.totalGstRate || 0) / 2).toFixed(2)}%)</span>
                    <span className="font-medium">₹{order.cgstAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                    <span>Invoice Total</span>
                    <span>₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
                 {order.payments && order.payments.length > 0 && (
                    <>
                        <Separator className="my-2" />
                        {order.payments.map(p => (
                             <div className="flex justify-between text-xs" key={p.id}>
                                <span>Payment ({new Date(p.date).toLocaleDateString()})</span>
                                <span className="font-medium">-₹{p.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </>
                 )}
                <Separator className="my-2 bg-black" />
                <div className="flex justify-between font-bold text-lg">
                    <span>Balance Due</span>
                    <span>₹{order.balanceDue?.toFixed(2) || order.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-8 left-8 right-8 print:bottom-8 print:left-8 print:right-8">
            <div className="flex justify-between items-end">
                <div>
                    <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                    <p className="text-xs text-gray-500">Payment is due within 30 days. Late payments are subject to a fee.</p>
                </div>
                <div className="w-48 text-center">
                    <Separator className="bg-black mb-2" />
                    <p className="text-xs font-semibold">Authorized Signatory</p>
                </div>
            </div>
        </div>
    </div>
);
