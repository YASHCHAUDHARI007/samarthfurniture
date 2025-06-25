
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const menuItems = [
  { name: 'Gateway of Tally', path: '/' },
  {
    name: 'Masters',
    subItems: [
        { name: 'Chart of Accounts', path: '/chart-of-accounts' },
        { name: 'Finished Stock', path: '/stock-turnover' },
        { name: 'Raw Materials', path: '/raw-materials' },
        { name: 'Locations', path: '/locations' },
        { name: 'Companies', path: '/manage-companies' },
        { name: 'Users', path: '/manage-users' },
    ]
  },
  {
    name: 'Vouchers',
    subItems: [
      { name: 'Payment', path: '/payments?tab=payment', fkey: 'F5' },
      { name: 'Receipt', path: '/payments?tab=receipt', fkey: 'F6' },
      { name: 'Sales', path: '/direct-sale', fkey: 'F8' },
      { name: 'Purchase', path: '/purchases', fkey: 'F9' },
    ],
  },
  {
    name: 'Reports',
    subItems: [
        { name: 'Ledger', path: '/ledger' },
        { name: 'Daily Report', path: '/daily-report' },
    ]
  },
   { name: 'GST Reports', path: '/gst-reports' },
  { name: 'Quit', action: 'quit' },
];


export function TallySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('Gateway of Tally');

  const handleQuit = () => {
    if (confirm('Are you sure you want to quit?')) {
        router.push('/login');
    }
  }

  const handleMenuClick = (item: (typeof menuItems)[0]) => {
    setActiveMenu(item.name);
    if(item.path) {
        router.push(item.path);
    }
  }
  
  const activeSubItems = menuItems.find(item => item.name === activeMenu)?.subItems || [];

  return (
    <aside className="w-64 bg-tally-sidebar border-l border-tally-border p-2 flex flex-col justify-between">
      <div>
        <ul className="space-y-1">
            {menuItems.map((item) => (
            <li key={item.name}>
                <button 
                    onClick={item.action === 'quit' ? handleQuit : () => handleMenuClick(item)} 
                    className={cn(
                        'w-full text-left p-1 rounded-sm',
                        activeMenu === item.name ? 'bg-tally-accent text-white' : 'hover:bg-tally-accent/80 hover:text-white'
                    )}
                >
                    {item.name}
                </button>
            </li>
            ))}
        </ul>
      </div>
      <div>
        <ul className="space-y-1">
            {activeSubItems.map(subItem => (
                 <li key={subItem.name}>
                    <Link href={subItem.path} className={cn(
                        'flex justify-between items-center p-1 rounded-sm hover:bg-tally-accent/80 hover:text-white',
                        pathname === subItem.path && 'bg-tally-accent text-white'
                    )}>
                        <span>{subItem.name}</span>
                        {subItem.fkey && <span className="text-xs opacity-70">{subItem.fkey}</span>}
                    </Link>
                </li>
            ))}
        </ul>
      </div>
    </aside>
  );
}
