"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Company } from '@/lib/types';

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompanyId: (id: string | null) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, _setActiveCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const companiesJson = localStorage.getItem('companies');
    const allCompanies: Company[] = companiesJson ? JSON.parse(companiesJson) : [];
    setCompanies(allCompanies);

    const initialActiveId = localStorage.getItem('activeCompanyId');
    _setActiveCompanyId(initialActiveId);
    setIsLoading(false);
  }, []);

  const setActiveCompanyId = (id: string | null) => {
    if (id) {
        localStorage.setItem('activeCompanyId', id);
    } else {
        localStorage.removeItem('activeCompanyId');
    }
    window.location.reload(); 
  };

  const activeCompany = companies.find(c => c.id === activeCompanyId) || null;

  return (
    <CompanyContext.Provider value={{ companies, activeCompany, setActiveCompanyId, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
