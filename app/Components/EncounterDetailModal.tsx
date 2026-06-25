"use client";

import React from "react";

export default function EncounterDetailModal({
  encounter,
  onClose,
}: {
  encounter: any;
  onClose: () => void;
}) {
  // Safe fallbacks for missing data to prevent crashes on older records
  const vitals = encounter.vitals || {};
  const prescriptions = encounter.prescriptions || [];
  const labs = encounter.requestedLabs || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[5000] p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-8 border-b border-[#eadecc] bg-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute right-8 top-8 text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
          <span className="inline-block bg-[#eaf8f9] text-[#0f6266] font-mono text-[10px] font-bold px-3 py-1 rounded-md tracking-widest uppercase mb-3 border border-[#d8f3f5]">
            Encounter Record ID: {(encounter._id || "UNKNOWN").substring(18).toUpperCase()}
          </span>
          <h2 className="text-3xl font-bold text-[#0e1e38] font-serif">
            Detailed Case History Sheet
          </h2>
        </div>

        {/* SCROLLABLE CONTENT BODY */}
        <div className="p-8 overflow-y-auto bg-[#fcfaf4] custom-scrollbar space-y-6">
          
          {/* TOP INFO STRIP */}
          <div className="flex flex-col md:flex-row gap-6 justify-between bg-white border border-[#eadecc] rounded-2xl p-5 shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Visit</p>
              <p className="text-sm font-bold text-[#0e1e38] flex items-center gap-2">🗓️ {encounter.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Attending Specialist</p>
              <p className="text-sm font-bold text-[#0f6266] flex items-center gap-2">🩺 Dr. {encounter.doctorName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Reason to Visit</p>
              <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">🎯 {encounter.reasonToVisit || "Routine Checkup"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              
              {/* VITALS GRID */}
              <div className="bg-white border border-[#eadecc] rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-[#0e1e38] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                  Intake Vitals Timeline
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">BP</p>
                    <p className="text-sm font-bold font-mono text-[#0e1e38] mt-1">{vitals.bloodPressure || "--"}</p>
                  </div>
                  <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Pulse</p>
                    <p className="text-sm font-bold font-mono text-[#0f6266] mt-1">{vitals.pulseRate || "--"} <span className="text-[9px]">BPM</span></p>
                  </div>
                  <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Temp</p>
                    <p className="text-sm font-bold font-mono text-amber-500 mt-1">{vitals.temperature || "--"} <span className="text-[9px]">°F</span></p>
                  </div>
                  <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Glucose</p>
                    <p className="text-sm font-bold font-mono text-[#0e1e38] mt-1">{vitals.sugar || "--"} <span className="text-[9px]">mg/dL</span></p>
                  </div>
                  <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Weight</p>
                    <p className="text-sm font-bold font-mono text-[#0e1e38] mt-1">{vitals.weight || "--"} <span className="text-[9px]">Kg</span></p>
                  </div>
                  <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Height</p>
                    <p className="text-sm font-bold font-mono text-[#0e1e38] mt-1">{vitals.height || "--"} <span className="text-[9px]">cm</span></p>
                  </div>
                </div>
              </div>

              {/* ASSOCIATED BILLING LEDGER */}
              <div className="bg-white border border-[#eadecc] rounded-2xl p-5 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-[#0e1e38] uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">
                    Associated Billing Ledger
                  </h3>
                  <p className="text-xs font-bold text-[#0e1e38]">Invoice: #{encounter._id?.substring(18).toUpperCase() || 'N/A'}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Method: UPI / Counter</p>
                </div>
                <div className="text-right mt-6">
                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded tracking-widest uppercase border border-emerald-100">
                    PAID / CLEARED
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              
              {/* PHARMACOTHERAPY */}
              <div className="bg-white border border-[#eadecc] rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-[#0e1e38] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                  Prescribed Pharmacotherapy
                </h3>
                <div className="space-y-3">
                  {prescriptions.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No medications prescribed during this visit.</p>
                  ) : (
                    prescriptions.map((med: any, idx: number) => (
                      <div key={idx} className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-[#0f6266]">💊 {med.name}</p>
                          <p className="text-[10px] text-emerald-700 mt-0.5">Dosage Strategy: {med.frequency} ({med.instruction})</p>
                        </div>
                        <div className="text-center bg-white border border-emerald-100 px-2 py-1 rounded-lg shadow-sm">
                          <p className="text-[10px] font-bold text-gray-500">⏱ {med.duration}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* DIAGNOSTIC LABS */}
              <div className="bg-white border border-[#eadecc] rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-[#0e1e38] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                  Diagnostic Laboratory & Radiology
                </h3>
                <div className="space-y-3">
                  {labs.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No diagnostics requested.</p>
                  ) : (
                    labs.map((lab: string, idx: number) => (
                      <div key={idx} className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl flex justify-between items-center hover:border-[#0f6266]/30 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-[#0e1e38]">🧪 {lab}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">Status: Pending Sample Collection</p>
                        </div>
                        <button className="bg-white border border-gray-200 text-[#0f6266] text-[10px] font-bold px-3 py-1.5 rounded cursor-pointer shadow-sm hover:bg-slate-50 transition-colors">
                          📄 Open PDF
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CLINICAL REMARKS */}
          <div className="bg-white border border-[#eadecc] rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-[#0e1e38] uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">
              Physician Clinical Remarks & Impression
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-[#fcfaf4] p-4 rounded-xl border border-[#eadecc]/60 italic">
              "{encounter.remarks || "No detailed clinical remarks recorded for this encounter."}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}