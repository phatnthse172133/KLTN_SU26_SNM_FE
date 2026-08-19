"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/application/context/AuthContext';
import { MarketOwnerSidebar } from './Sidebar';

export function MarketOwnerLayoutShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'MarketOwner' && user.role !== 'Admin') {
      router.replace('/login');
    }
  }, [isReady, isAuthenticated, user, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <MarketOwnerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
