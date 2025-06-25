
"use client";

import Link from "next/link";

const MenuHeader = ({ title }: { title: string }) => (
    <div className="text-center border-b border-tally-border py-0.5">
        <h3 className="font-semibold text-tally-fg/80">{title}</h3>
    </div>
);

const MenuItem = ({ path, children, className }: { path: string, children: React.ReactNode, className?: string }) => (
    <Link href={path} className={`block p-1 hover:bg-tally-accent focus:bg-tally-accent outline-none ${className}`}>
        {children}
    </Link>
)

const Highlight = ({ char, text }: { char: string, text: string }) => {
    const index = text.toUpperCase().indexOf(char.toUpperCase());
    if (index === -1) return <>{text}</>;
    return (
        <>
            {text.substring(0, index)}
            <span className="font-bold text-red-600">{text.substring(index, index + 1)}</span>
            {text.substring(index + 1)}
        </>
    );
}

export const TallyGatewayMenu = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-1/2 max-w-sm border-2 border-tally-border bg-white text-tally-fg">
                <div className="text-center bg-tally-header-bg text-tally-header-fg p-1">
                    <h2 className="font-bold">GATEWAY OF TALLY</h2>
                </div>
                <div className="p-2 space-y-2">
                    <MenuHeader title="MASTERS" />
                    <MenuItem path="/chart-of-accounts"><Highlight char="C" text="Chart of Accounts" /></MenuItem>

                    <MenuHeader title="TRANSACTIONS" />
                     <MenuItem path="/payments"><Highlight char="V" text="Vouchers" /></MenuItem>
                    
                    <MenuHeader title="REPORTS" />
                    <MenuItem path="/ledger"><Highlight char="L" text="Ledger" /></MenuItem>
                    <MenuItem path="/gst-reports"><Highlight char="G" text="GST Reports" /></MenuItem>
                    <MenuItem path="/daily-report"><Highlight char="D" text="Daily Report" /></MenuItem>

                    <MenuItem path="/login" className="mt-4"><Highlight char="Q" text="Quit" /></MenuItem>
                </div>
            </div>
        </div>
    )
}
