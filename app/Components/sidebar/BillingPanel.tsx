'use client';

import React, { useEffect, useState } from 'react';
import { fetchCentralBills, HospitalBill } from '@/app/actions';
import AppointmentBillModal from '../AppointmentBillingModal';
import CollectPaymentModal from '../CollectPaymentModal'; // Imported the settlement window
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BillingPanel() {
  const [activeTab, setActiveTab] = useState<'Pharmacy' | 'Appointment'>('Pharmacy');
  const [ledger, setLedger] = useState<HospitalBill[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);
  
  // NEW FEATURE 1: Interactive Filtering Controls States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // NEW FEATURE 2: Active Staged Bill Context for Settlement Window
  const [stagedPaymentBill, setStagedPaymentBill] = useState<any | null>(null);

  const loadLedgerData = async () => {
    const res = await fetchCentralBills(activeTab);
    if (res.success) setLedger(res.data);
  };

  useEffect(() => {
    loadLedgerData();
  }, [activeTab]);

  // PATCH 1: Added safe fallbacks (|| 'Fallback') to prevent undefined crashes
  const downloadPDFBill = (bill: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('IDHN HOSPITAL CENTRAL RECEIPT', 14, 22);
    doc.setFontSize(10);
    
    // Add safe chaining and fallbacks for string methods
    doc.text(`Receipt Reference: #${(bill._id || '000000000000000000').substring(18).toUpperCase()}`, 14, 32);
    doc.text(`Department Stream: ${(bill.department || 'Appointment').toUpperCase()}`, 14, 37);
    doc.text(`Timestamp: ${bill.createdAt || new Date().toLocaleString()}`, 14, 42);
    
    doc.text(`Primary Billee Account: ${bill.billeeName || 'Unknown'}`, 14, 52);
    if (bill.doctorName) doc.text(`Consultant In Charge: Dr. ${bill.doctorName}`, 14, 57);
    
    // Check for both 'status' and 'paymentStatus'
    const finalStatus = bill.status || bill.paymentStatus || 'UNPAID';
    doc.text(`Financial Status: ${finalStatus.toUpperCase()} (${bill.paymentMethod || 'DUES'})`, 14, 62);

    const cols = ["Line Item Description", "Qty Ordered", "Line Allocation Valuation"];
    const rows = (bill.items || []).map((i: any) => [i.description, i.qty?.toString(), `Rs. ${(i.total || 0).toFixed(2)}`]);

    autoTable(doc, {
      startY: 70,
      head: [cols],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 98, 102] }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 70;
    doc.setFontSize(14);
    doc.text(`Total Settled Liability: Rs. ${(bill.amount || 0).toFixed(2)}`, 14, finalY + 12);
    doc.save(`Central_Receipt_${(bill._id || 'new').substring(18)}.pdf`);
  };

  // PATCH 2: Explicitly map the missing 'department' and 'status' parameters into the payload
  const handleModalSuccess = (newBillId: string, payload: any) => {
    setIsModalOpen(false);
    setSuccessMsg(true);
    loadLedgerData();
    
    // Feed the PDF generator the exact structured object it expects
    downloadPDFBill({ 
      _id: newBillId, 
      createdAt: new Date().toLocaleString('en-GB'), 
      department: 'Appointment',
      status: payload.paymentStatus, 
      ...payload 
    });
    
    setTimeout(() => setSuccessMsg(false), 2000);
  };
  const handleSettlementSuccess = () => {
    setStagedPaymentBill(null);
    setSuccessMsg(true);
    loadLedgerData(); // Live refresh: instantly routes unbilled metrics to the paid arrays stack view
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  // NEW FEATURE 1: Client side processing filtering arrays pipeline
  const filteredLedger = ledger.filter((bill) => {
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || (bill.paymentMethod && bill.paymentMethod.toUpperCase() === methodFilter.toUpperCase());
    return matchesStatus && matchesMethod;
  });

  return (
    <div className="p-8 bg-[#fcfaf4] min-h-screen text-slate-800 font-sans relative">
      
      {/* Top Header Controls Area */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center border-b border-[#eadecc] pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[#0e1e38]">Central Billing Office</h1>
          <p className="text-xs text-gray-400 mt-0.5">Real-time financial cross-referencing for outpatients and dispensaries.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          
          {/* FEATURE 1: Dynamic Parameter Dropdown Filter Selectors */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-[#eadecc] rounded-xl shadow-sm">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none text-slate-700 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid Ledger Only</option>
              <option value="unpaid">Outstanding Unpaid</option>
            </select>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <select 
              value={methodFilter} 
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none text-slate-700 cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="UPI">UPI / Paytm QR</option>
              <option value="Cash">Physical Cash</option>
              <option value="Card">Credit/Debit Card</option>
            </select>
          </div>

          <div className="flex bg-white p-1 rounded-xl border border-[#eadecc] gap-1 shadow-sm">
            <button onClick={() => { setActiveTab('Pharmacy'); setStatusFilter('all'); setMethodFilter('all'); }} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'Pharmacy' ? 'bg-[#0f6266] text-white' : 'text-gray-500 hover:bg-slate-50'}`}>
              📦 Pharmacy Ledger
            </button>
            <button onClick={() => { setActiveTab('Appointment'); setStatusFilter('all'); setMethodFilter('all'); }} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'Appointment' ? 'bg-[#0f6266] text-white' : 'text-gray-500 hover:bg-slate-50'}`}>
              🗓️ OPD Appointments
            </button>
          </div>

          {activeTab === 'Appointment' && (
            <button onClick={() => setIsModalOpen(true)} className="bg-[#e2a83b] hover:bg-[#c9922f] text-white font-bold text-xs px-4 py-3 rounded-xl shadow-sm transition-colors cursor-pointer">
              + Process Appointment
            </button>
          )}
        </div>
      </div>

      {successMsg && <div className="p-3 mb-4 text-xs font-bold text-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl animate-in fade-in duration-200">✓ Invoice processed. Accounting database synced and updated successfully.</div>}

      {/* RENDER DYNAMIC MASTER INVOICE ROWS */}
      <div className="space-y-3 w-full">
        {filteredLedger.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">No matching tracking receipts matched the active criteria.</p>
        ) : (
          filteredLedger.map((bill) => (
            <div key={bill._id} className="bg-white border border-[#eadecc] p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#0f6266]/30 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">#{bill._id.substring(18).toUpperCase()}</span>
                  <span className="text-[10px] text-gray-400 font-mono">{bill.createdAt}</span>
                  {bill.paymentMethod && (
                    <span className="text-[9px] font-bold tracking-wide uppercase bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                      ⚡ {bill.paymentMethod}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-[#0e1e38]">
                  Account: <span className="font-semibold text-slate-700">{bill.billeeName}</span>
                  {bill.doctorName && <span className="text-gray-400 font-normal"> • Attending: Dr. {bill.doctorName}</span>}
                </h4>
              </div>

              <div className="flex items-center gap-4 justify-between sm:justify-end">
                <div className="text-right min-w-[80px]">
                  <p className="text-xs font-mono font-bold">₹{bill.amount.toFixed(2)}</p>
                  <span className={`text-[10px] font-bold uppercase ${bill.status === 'paid' ? 'text-emerald-600' : 'text-red-500'}`}>
                    ● {bill.status === 'paid' ? 'PAID' : 'UNPAID'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* FEATURE 2: If the bill is unpaid, append the pay dues button right alongside print features */}
                  {bill.status === 'unpaid' && (
                    <button 
                      onClick={() => setStagedPaymentBill({ _id: bill._id, amount: bill.amount, name: bill.billeeName })}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] px-3 py-2 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      Collect Payment
                    </button>
                  )}
                  
                  <button onClick={() => downloadPDFBill(bill)} className="border border-gray-300 hover:border-[#0f6266] text-gray-500 hover:text-[#0f6266] font-bold text-[11px] px-3 py-2 rounded-lg transition-all cursor-pointer shadow-sm bg-white">
                    📄 Print PDF
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Appointment Creator Overlay Modals */}
      {isModalOpen && <AppointmentBillModal onClose={() => setIsModalOpen(false)} onSuccess={handleModalSuccess} />}

      {/* FEATURE 2: Collect Due Payment Window Overlay Terminal */}
      {stagedPaymentBill && (
        <CollectPaymentModal 
          bill={stagedPaymentBill} 
          onClose={() => setStagedPaymentBill(null)} 
          onSuccess={handleSettlementSuccess} 
        />
      )}
    </div>
  );
}