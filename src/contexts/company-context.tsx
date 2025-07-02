"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Company, UserRole } from '@/lib/types';

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

  // This effect runs only once on mount to initialize everything.
  useEffect(() => {
    const userRole = localStorage.getItem("userRole") as UserRole | null;
    const companiesJson = localStorage.getItem('companies');
    const allCompanies: Company[] = companiesJson ? JSON.parse(companiesJson) : [];
    setCompanies(allCompanies);

    let initialActiveId = localStorage.getItem('activeCompanyId');

    if (!initialActiveId && (userRole === 'coordinator' || userRole === 'factory') && allCompanies.length > 0) {
      // Find most recent company and set it as active
      const sortedCompanies = [...allCompanies].sort((a, b) => new Date(b.financialYearStart).getTime() - new Date(a.financialYearStart).getTime());
      initialActiveId = sortedCompanies[0].id;
      localStorage.setItem('activeCompanyId', initialActiveId);
    }
    
    _setActiveCompanyId(initialActiveId);
    setIsLoading(false);
  }, []); // Empty dependency array ensures it runs once.

  const setActiveCompanyId = (id: string | null) => {
    if (id) {
        localStorage.setItem('activeCompanyId', id);
    } else {
        localStorage.removeItem('activeCompanyId');
    }
    _setActiveCompanyId(id);
    window.location.reload(); // Reload to ensure all components get the new context correctly.
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
