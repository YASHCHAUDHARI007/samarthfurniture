
"use client";

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { Company } from '@/lib/types';

export function TallyHeader() {
  const [company, setCompany] = useState<Company | null>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const activeCompanyId = localStorage.getItem('activeCompanyId');
    const companies: Company[] = JSON.parse(localStorage.getItem('samarth_furniture_companies') || '[]');
    const activeCompany = companies.find(c => c.id === activeCompanyId);
    setCompany(activeCompany || null);

    setCurrentDate(format(new Date(), 'dd-MMM-yyyy'));
    setUsername(localStorage.getItem('loggedInUser') || 'Admin');
  }, []);

  const fyStart = company ? format(new Date(company.financialYearStart), 'dd-MMM-yy') : '';
  const fyEnd = company ? format(new Date(company.financialYearEnd), 'dd-MMM-yy') : '';

  return (
    <header className="flex items-center justify-between bg-tally-header text-tally-header-fg h-10 px-4 border-b border-tally-border">
      <div className="flex items-center gap-4">
        <h1 className="font-bold text-base">{company?.name || 'No Company Selected'}</h1>
        <p className="text-xs">FY: {fyStart} to {fyEnd}</p>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <p>Date: {currentDate}</p>
        <p>User: {username}</p>
      </div>
    </header>
  );
}
