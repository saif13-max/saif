/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ShoppingBag, ShieldAlert, GraduationCap, Sparkles, BookOpen } from 'lucide-react';
import ShopLayout from './components/ShopLayout';
import AdminPanel from './components/AdminPanel';
import DocsHub from './components/DocsHub';

export default function App() {
  const [activeTab, setActiveTab] = useState<'shop' | 'admin' | 'docs'>('shop');
  const [ordersRefreshCount, setOrdersRefreshCount] = useState<number>(0);

  const handleOrderNotification = () => {
    setOrdersRefreshCount(prev => prev + 1);
  };

  return (
    <div id="app-viewport-root" className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0F172A] antialiased">
      
      {/* Dynamic Header Navbar Section */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.02)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Brandings */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
              <ShoppingBag className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-sans font-extrabold text-xl tracking-tight text-[#2563EB] block leading-none">
                HOME<span className="text-[#0F172A]">APPLIER</span>
              </span>
              <span className="font-mono text-[9px] text-[#64748B] uppercase tracking-widest font-bold block mt-1">
                Appraisal System
              </span>
            </div>
          </div>

          {/* Master Tabs Controller Switches */}
          <nav className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] shadow-inner">
            <button
              id="btn-nav-shop"
              onClick={() => setActiveTab('shop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                activeTab === 'shop'
                  ? 'bg-white text-[#2563EB] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              🌐 Shop Platform
            </button>
            <button
              id="btn-nav-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-[#2563EB] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              🛡️ Admin Portal
            </button>
            <button
              id="btn-nav-docs"
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-white text-[#2563EB] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              📘 Academics & Docs
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Sections renders */}
      <main className="flex-1 pb-16">
        {activeTab === 'shop' && (
          <ShopLayout onOrderPlaced={handleOrderNotification} />
        )}
        {activeTab === 'admin' && (
          <AdminPanel ordersRefreshCount={ordersRefreshCount} />
        )}
        {activeTab === 'docs' && (
          <DocsHub />
        )}
      </main>

      {/* Academic Sticky Footer Disclaimer */}
      <footer className="w-full bg-[#0F172A] border-t border-[#1e293b] py-5 px-6 text-center text-xs font-sans text-[#94A3B8]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 justify-center">
            <GraduationCap className="w-4.5 h-4.5 text-[#F59E0B]" />
            <span>
              A project prototype developed for <strong className="text-white">The Islamia University of Bahawalpur</strong> | Supervisor: Ma'am Asma Hameed
            </span>
          </div>
          <div className="font-mono text-[10px] text-[#64748B]">
            By: Abdullah Saif (S23NDOCS1M01075) • Secured on sandboxed Express DB
          </div>
        </div>
      </footer>
    </div>
  );
}
