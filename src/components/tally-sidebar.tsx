'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { Company } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

export function TallyLeftPanel() {
  const [company, setCompany] = useState<Company | null>(null);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const activeCompanyId = localStorage.getItem('activeCompanyId');
    const companies: Company[] = JSON.parse(localStorage.getItem('samarth_furniture_companies') || '[]');
    const activeCompany = companies.find(c => c.id === activeCompanyId);
    setCompany(activeCompany || null);

    setCurrentDate(format(new Date(), 'eeee, d-MMM-yyyy'));
  }, []);

  const fyStart = company ? format(parseISO(company.financialYearStart), 'd-MMM-yy') : '';
  const fyEnd = company ? format(parseISO(company.financialYearEnd), 'd-MMM-yy') : '';
  
  return (
    <aside className="w-64 bg-tally-bg border-r-2 border-r-gray-400 p-2 flex flex-col gap-4">
      <div className="border border-tally-border p-2">
        <h3 className="text-center font-bold">Gateway of Tally</h3>
      </div>
      <div className="flex-grow space-y-4 text-xs">
          <div>
            <p className="text-tally-fg/70">CURRENT PERIOD</p>
            <p className="font-semibold">{fyStart} to {fyEnd}</p>
          </div>
           <div>
            <p className="text-tally-fg/70">CURRENT DATE</p>
            <p className="font-semibold">{currentDate}</p>
          </div>
           <div>
            <p className="text-tally-fg/70">NAME OF COMPANY</p>
            <p className="font-semibold">{company?.name || 'No Company Selected'}</p>
          </div>
           <div>
            <p className="text-tally-fg/70">DATE OF LAST ENTRY</p>
            <p className="font-semibold">N/A</p>
          </div>
      </div>
    </aside>
  );
}
