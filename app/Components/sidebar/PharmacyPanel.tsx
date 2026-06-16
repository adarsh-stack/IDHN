'use client';

import React, { useEffect, useState } from 'react';
import { fetchInventory, MedicineItem } from '@/app/actions';
import PharmacyStockView from '../PharmacyStockView';
import PharmacyDispenseView from '../PharmacyDispenseView';

export default function PharmacyPanel() {
  const [activeTab, setActiveTab] = useState<'stock' | 'dispense'>('dispense');
  const [inventory, setInventory] = useState<MedicineItem[]>([]);

  const syncInventoryData = async () => {
    const res = await fetchInventory();
    if (res.success) setInventory(res.data);
  };

  useEffect(() => {
    syncInventoryData();
  }, []);

  return (
    <div className="p-8 bg-[#fcfaf4] min-h-screen text-slate-800 font-sans relative">
      {/* Global Module Section Top Title Bar Layout */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#eadecc] pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[#0e1e38]">Pharmacy Ecosystem</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage localized physical inventory controls and clinical distribution desks.</p>
        </div>

        {/* Modular Workspace Toggles */}
        <div className="flex bg-white p-1 rounded-xl border border-[#eadecc] gap-1 shadow-sm h-fit">
          <button 
            onClick={() => setActiveTab('dispense')}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'dispense' ? 'bg-[#0f6266] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
          >
            💊 Dispensing Desk
          </button>
          <button 
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'stock' ? 'bg-[#0f6266] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
          >
            📦 Inventory & Stock
          </button>
          
        </div>
      </div>

      {/* DYNAMIC PRESENTATION CONTENT DISPATCHER */}
      {activeTab === 'stock' ? (
        <PharmacyStockView inventory={inventory} onRefresh={syncInventoryData} />
      ) : (
        <PharmacyDispenseView inventory={inventory} onRefresh={syncInventoryData} />
      )}
    </div>
  );
}