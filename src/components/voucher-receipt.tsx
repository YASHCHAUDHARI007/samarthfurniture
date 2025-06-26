
"use client";

import { Separator } from "@/components/ui/separator";
import { Armchair, IndianRupee } from "lucide-react";
import type { Company } from "@/lib/types";

interface VoucherPrintData {
    id: string;
    type: 'Receipt' | 'Payment';
    contactName: string;
    amount: number;
    date: string;
    method: string;
    reference?: string;
    againstBill?: string;
}


export const VoucherReceipt = ({ voucher, company }: { voucher: VoucherPrintData, company: Company | null }) => {
    const isReceipt = voucher.type === 'Receipt';
    const title = isReceipt ? "Receipt Voucher" : "Payment Voucher";
    const partyLabel = isReceipt ? "Received from" : "Paid to";

    return (
        <div className="bg-white text-black p-8 w-full min-h-[210mm] max-w-[210mm] mx-auto shadow-lg print:shadow-none relative font-sans">
            {/* Header */}
            <div className="text-center mb-6">
                 <h2 className="text-xl font-bold uppercase tracking-wider">{title}</h2>
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <Armchair className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">{company?.name || 'Samarth Furniture'}</h1>
                        <p className="text-xs text-gray-500">123 Furniture Lane, Anytown, ST 12345</p>
                    </div>
                </div>
                 <div className="text-right text-sm">
                    <p>Voucher No: <span className="font-medium">{voucher.id.substring(0, 10)}</span></p>
                    <p>Date: <span className="font-medium">{new Date(voucher.date).toLocaleDateString()}</span></p>
                </div>
            </div>

            <Separator className="my-6 border-gray-400" />
            
            <div className="space-y-4 text-base">
                <div className="flex">
                    <p className="w-48 font-semibold">{partyLabel}:</p>
                    <p className="border-b border-dotted border-gray-400 flex-grow font-medium">{voucher.contactName}</p>
                </div>
                
                 <div className="flex items-end">
                    <p className="w-48 font-semibold">The sum of Rupees:</p>
                    <div className="border-b border-dotted border-gray-400 flex-grow font-bold text-lg flex items-center px-2">
                        <IndianRupee className="h-5 w-5 mr-1" />
                        <span>{voucher.amount.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex">
                    <p className="w-48 font-semibold">By:</p>
                    <p className="border-b border-dotted border-gray-400 flex-grow">{voucher.method}{voucher.reference ? ` (Ref: ${voucher.reference})` : ''}</p>
                </div>

                {voucher.againstBill && (
                    <div className="flex">
                        <p className="w-48 font-semibold">Against Bill No:</p>
                        <p className="border-b border-dotted border-gray-400 flex-grow">{voucher.againstBill}</p>
                    </div>
                )}
            </div>


            {/* Footer & Signatures */}
            <div className="absolute bottom-16 left-8 right-8 print:bottom-16 print:left-8 print:right-8">
                <div className="flex justify-between items-end">
                    <div className="w-64 text-center">
                         <Separator className="bg-black mb-2" />
                        <p className="text-sm font-semibold">Receiver's Signature</p>
                    </div>
                    <div className="w-64 text-center">
                        <Separator className="bg-black mb-2" />
                        <p className="text-sm font-semibold">Authorized Signatory</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

    