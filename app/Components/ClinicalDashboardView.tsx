'use client';

import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import  DashboardPanel  from './sidebar/DashboardPanel';
import PatientsPanel from './sidebar/PatientPanel';
import PharmacyPanel from './sidebar/PharmacyPanel';
// Sub-panel panel fallbacks (Replace these with your actual component imports as you build them)
// const DashboardPanel = () => <div className="p-6 text-slate-800 text-xl font-bold">🏠 Dashboard Core Overview</div>;
const OPDPanel = () => <div className="p-6 text-slate-800 text-xl font-bold">🩺 OPD / Doctors Management Console</div>;
const IPDPanel = () => <div className="p-6 text-slate-800 text-xl font-bold">🛏️ IPD / Wards Patient Allocation</div>;
const LaboratoryPanel = () => <div className="p-6 text-slate-800 text-xl font-bold">🔬 Laboratory Information System (LIS)</div>;
// const PharmacyPanel = () => <div className="p-6 text-slate-800 text-xl font-bold">💊 Pharmacy Stock & Dispensing Ledger</div>;
const BillingPanel = () => <div className="p-6 text-slate-800 text-xl font-bold">🧾 Billing & Cashless TPA Invoice Hub</div>;
// const PatientsPanel = () => <div className="p-6 text-slate-800 text-xl font-bold">👥 Patient Universal Registration Registry</div>;

export default function ClinicalDashboardView() {
  // Local state to manage which menu item is currently open
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Conditional engine mapping the active tab ID to the correct view panel
  const renderActivePanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPanel />;
      case 'opd':
        return <OPDPanel />;
      case 'ipd':
        return <IPDPanel />;
      case 'laboratory':
        return <LaboratoryPanel />;
      case 'pharmacy':
        return <PharmacyPanel />;
      case 'billing':
        return <BillingPanel />;
      case 'patients':
        return <PatientsPanel />;
      default:
        return <DashboardPanel />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#ffffff]">
      {/* 1. Global Application System Header */}
      <Header />

      {/* 2. Main Workspace Row Wrapper */}
      <div className="flex flex-1 ">
        {/* Fixed Left Sidebar Module passing tracking states */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* 3. Scrollable Content Window Area displaying the chosen layout panel */}
        <main className="flex-1  bg-gradient-to-br from-[#fcfaf4] to-[#f5f0e1] overflow-y-auto">
          <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm min-h-[calc(100vh-140px)]">
            {renderActivePanel()}
          </div>
        </main>
      </div>
    </div>
  );
}