
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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookText, Search } from "lucide-react";
import type { Contact } from "@/lib/types";

const internalAccounts = [
    { id: 'SALES_ACCOUNT', name: 'Sales Account', type: 'Internal' },
    { id: 'PURCHASE_ACCOUNT', name: 'Purchase Account', type: 'Internal' },
    { id: 'CASH_BANK_ACCOUNT', name: 'Cash/Bank Account', type: 'Internal' },
];

export default function LedgerPage() {
  const router = useRouter();
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
  }, []);

  useEffect(() => {
    if (!activeCompanyId) {
        setAllContacts([]);
        return;
    };
    const contactsKey = `samarth_furniture_${activeCompanyId}_contacts`;
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem(contactsKey) || '[]');
    setAllContacts(storedContacts);
  }, [activeCompanyId]);

  const ledgerAccounts = useMemo(() => {
    return [...internalAccounts, ...allContacts].sort((a,b) => a.name.localeCompare(b.name));
  }, [allContacts]);

  const filteredAccounts = useMemo(() => {
    if (!searchTerm) {
        return ledgerAccounts;
    }
    return ledgerAccounts.filter(acc => acc.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, ledgerAccounts]);
  
  const handleOpenLedger = (accountId: string) => {
    router.push(`/ledger/${accountId}`);
  };

  if (!activeCompanyId) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Company Selected</CardTitle>
            </CardHeader>
            <CardContent><p>Please select or create a company to view ledger accounts.</p></CardContent>
            <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
          </Card>
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <BookText className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Ledger Accounts</h2>
      </div>
      <p className="text-muted-foreground">
        Search for an account to view its detailed statement.
      </p>
      <Separator />

      <Card className="mt-6">
          <CardHeader>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>Select an account to view its full statement.</CardDescription>
              <div className="relative pt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Search accounts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                  />
              </div>
          </CardHeader>
          <CardContent>
              <ScrollArea className="h-[60vh]">
                  <div className="flex flex-col gap-1 pr-2">
                      {filteredAccounts.map(account => (
                          <Button
                              key={account.id}
                              variant={'ghost'}
                              className="w-full justify-start text-left h-auto py-2"
                              onClick={() => handleOpenLedger(account.id)}
                          >
                              <div>
                                  <p className="font-semibold">{account.name}</p>
                                  <p className="text-xs text-muted-foreground">{'type' in account ? account.type : 'Internal'}</p>
                              </div>
                          </Button>
                      ))}
                      {filteredAccounts.length === 0 && (
                        <div className="text-center text-muted-foreground p-4">No accounts found.</div>
                      )}
                  </div>
              </ScrollArea>
          </CardContent>
      </Card>
    </div>
  );
}
