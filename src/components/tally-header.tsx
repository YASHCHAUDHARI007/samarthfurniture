
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Button } from '@/components/ui/button';

const UnderlinedChar = ({ char, text }: { char: string, text: string }) => {
    const index = text.toUpperCase().indexOf(char.toUpperCase());
    if (index === -1) return <>{text}</>;
    return (
        <>
            {text.substring(0, index)}
            <span className="underline">{text.substring(index, index + 1)}</span>
            {text.substring(index + 1)}
        </>
    );
}

const TallyMenuButton = ({ char, text, children }: { char: string, text: string, children: React.ReactNode }) => (
    <MenubarMenu>
        <MenubarTrigger className="px-2 py-0.5 h-auto text-tally-header-fg hover:bg-tally-menu-bg hover:text-tally-fg data-[state=open]:bg-tally-menu-bg data-[state=open]:text-tally-fg rounded-none">
            <UnderlinedChar char={char} text={`${char}: ${text}`} />
        </MenubarTrigger>
        <MenubarContent className="bg-tally-menu-bg border-tally-border text-tally-fg rounded-none shadow-lg">
            {children}
        </MenubarContent>
    </MenubarMenu>
)

const TallyMenuItem = ({ shortcut, children }: { shortcut?: string, children: React.ReactNode}) => (
    <MenubarItem className="px-3 hover:bg-tally-accent hover:text-tally-fg rounded-none focus:bg-tally-accent">
        <span className="flex-grow">{children}</span>
        {shortcut && <span className="text-xs ml-8">{shortcut}</span>}
    </MenubarItem>
)

export function TallyHeader() {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between bg-tally-header-bg text-tally-header-fg h-8 px-1">
      <div className='flex items-center'>
        <p className='font-bold text-lg px-2'>Tally Prime</p>
        <Menubar className="p-0 h-auto border-none bg-transparent">
            <TallyMenuButton char="K" text="Company">
                 <TallyMenuItem>
                    <Link href="/manage-companies">
                        <div>
                            <span className="font-bold">C</span>reate
                        </div>
                    </Link>
                </TallyMenuItem>
                 <TallyMenuItem>
                    <div>
                        <span className="font-bold">A</span>lter
                    </div>
                </TallyMenuItem>
                <TallyMenuItem shortcut="F3">
                    <div>
                        CH<span className="font-bold">a</span>nGe
                    </div>
                </TallyMenuItem>
                 <TallyMenuItem shortcut="Alt+F3">
                    <div>
                        <span className="font-bold">S</span>elect
                    </div>
                </TallyMenuItem>
                 <TallyMenuItem shortcut="Ctrl+F3">
                    <div>
                        SH<span className="font-bold">u</span>t
                    </div>
                </TallyMenuItem>
                <MenubarSeparator className="bg-tally-border"/>
                <TallyMenuItem>
                    <div>
                        Features <span className="ml-2 font-bold">F11</span>
                    </div>
                </TallyMenuItem>
            </TallyMenuButton>
            <TallyMenuButton char="Y" text="Data">
                <TallyMenuItem>Backup</TallyMenuItem>
                <TallyMenuItem>Restore</TallyMenuItem>
            </TallyMenuButton>
        </Menubar>
      </div>
      <div className='flex items-center gap-2'>
         <Button variant="outline" className="px-2 py-0.5 h-auto text-tally-header-fg hover:bg-tally-menu-bg hover:text-tally-fg rounded-none border-tally-border/50">
           <UnderlinedChar char="G" text="G: Go To" />
         </Button>
          <Button variant="outline" className="px-2 py-0.5 h-auto text-tally-header-fg hover:bg-tally-menu-bg hover:text-tally-fg rounded-none border-tally-border/50">
           <UnderlinedChar char="P" text="P: Print" />
         </Button>
          <Button variant="outline" className="px-2 py-0.5 h-auto text-tally-header-fg hover:bg-tally-menu-bg hover:text-tally-fg rounded-none border-tally-border/50">
           <UnderlinedChar char="F1" text="F1: Help" />
         </Button>
      </div>
    </header>
  );
}
