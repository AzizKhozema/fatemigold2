'use client'; 

import { ReactNode, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { Menu, } from 'lucide-react'; // 👈 You need an icon
import NavBar from '@/app/components/NavBar';

interface SideBarLayoutProps {
  children: ReactNode;
}

export default function SideBarLayout({ children }: SideBarLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar receives the state to know if it should slide in */}
            <Sidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />

            {/* Main Content */}
            {isMobileMenuOpen ? true : <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 lg:hidden">
                
                {/* 👇 YOU NEED THIS HEADER */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center gap-4 w-screen ">
                    {/* The Trigger Button */}
                    <button  
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p- 2 hover:bg-gray-100 rounded-md text-gray-600 m-4"
                    >
                        <Menu size={24} />
                    </button>
                    {   < NavBar /> }

                    {/* <h1 className="font-bold text-lg text-gray-800 ">
                        Jewelry Manager
                    </h1> */}
                </header>

                {/* The Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
                }
        </div>
    );
}