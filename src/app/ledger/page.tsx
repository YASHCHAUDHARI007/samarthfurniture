
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
import { BookText, Search, ShieldAlert } from "lucide-react";
import type { Ledger } from "@/lib/types";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export default function LedgerPage() {
  const router = useRouter();
  const [allLedgers, setAllLedgers] = useState<Ledger[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        setAllLedgers([]);
        setIsLoading(false);
        return;
    };
    setIsLoading(true);
    const ledgersRef = ref(db, `ledgers/${activeCompanyId}`);
    const unsubscribe = onValue(ledgersRef, (snapshot) => {
        if(snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            setAllLedgers(list.sort((a,b) => a.name.localeCompare(b.name)));
        } else {
            setAllLedgers([]);
        }
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [activeCompanyId]);

  const filteredAccounts = useMemo(() => {
    if (!searchTerm) {
        return allLedgers;
    }
    return allLedgers.filter(acc => acc.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, allLedgers]);
  
  const handleOpenLedger = (accountId: string) => {
    router.push(`/ledger/${accountId}`);
  };

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="text-destructive" /> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent><p>You do not have permission to view this page.</p></CardContent>
          <CardFooter><Button onClick={() => router.push("/")}>Return to Dashboard</Button></CardFooter>
        </Card>
      </div>
    );
  }

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
                                  <p className="text-xs text-muted-foreground">{account.group}</p>
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

    