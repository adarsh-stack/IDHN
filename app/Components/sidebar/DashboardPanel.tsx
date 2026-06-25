"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // <-- Added Router Import
import { 
  fetchDashboardMetrics, 
  DashboardMetrics, 
  fetchConsultationQueue,
  triggerPatientCall,
  completePatientCheckup,
  QueueItem
} from "@/app/actions";

import DashboardInsights from "../DashboardInssights";

interface UserSession {
  name: string;
}

export default function DashboardPanel() {
  const router = useRouter(); // <-- Initialized Router

  const [userName, setUserName] = useState<string>("Dr. Sharma");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");
  
  // Live Queue States
  const [liveQueueData, setLiveQueueData] = useState<QueueItem[]>([]);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 1. Initial Setup & Live Metrics Polling
  useEffect(() => {
    const sessionStr = localStorage.getItem("idhn_session");
    if (sessionStr) {
      try {
        const session: UserSession = JSON.parse(sessionStr);
        setUserName(session.name);
      } catch (e) {
        console.error("Session parsing failed");
      }
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    };
    setCurrentDate(new Date().toLocaleDateString("en-IN", options));

    const loadMetrics = async () => {
      const res = await fetchDashboardMetrics();
      if (res.success && res.data) setMetrics(res.data);
    };

    loadMetrics();
    const metricsInterval = setInterval(loadMetrics, 5000);
    return () => clearInterval(metricsInterval);
  }, []);

  // 2. Synchronize queue metrics
  const loadDashboardQueue = async () => {
    const res = await fetchConsultationQueue();
    if (res.success) setLiveQueueData(res.data);
  };

  useEffect(() => {
    loadDashboardQueue();
    const queueInterval = setInterval(loadDashboardQueue, 5000);
    return () => clearInterval(queueInterval);
  }, []);

  // 3. Queue Actions
  const handleCallPatient = async (item: QueueItem) => {
    setCallingId(item._id);
    const res = await triggerPatientCall(item._id, item.patientName, item.patientId);
    setCallingId(null);
    if (res.success) {
      loadDashboardQueue();
    }
  };

  const handleRemovePatient = async (id: string) => {
    if (!confirm("Mark this patient's consultation as completed and remove from queue?")) return;
    setProcessingId(id);
    const res = await completePatientCheckup(id);
    setProcessingId(null);
    if (res.success) {
      loadDashboardQueue();
      const metricsRes = await fetchDashboardMetrics();
      if (metricsRes.success && metricsRes.data) setMetrics(metricsRes.data);
    } else {
      alert(res.message);
    }
  };

  if (!metrics) {
    return (
      <div className="p-8 text-[#0f6266] font-bold animate-pulse flex items-center gap-3 h-screen bg-[#fcfaf4]">
        <div className="w-5 h-5 border-4 border-[#0f6266] border-t-transparent rounded-full animate-spin"></div>
        Gathering core clinical metrics & loading workspace...
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#fcfaf4] font-sans min-h-screen relative">
      
      {/* Header Profile Greeting Panel */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#0e1e38] font-serif">
          Good morning, {userName}
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          {currentDate} • Multi-Speciality Hospital System
        </p>
      </div>

      {/* Analytics Card Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        
        {/* CARD 1: TODAY'S OPD */}
        <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Today's OPD
            </span>
            <span className="text-teal-600 text-lg">👤</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-[#0e1e38] tracking-tight transition-all duration-300">
                {metrics.todaysOpd}
              </h2>
              <span className="text-xs font-bold text-gray-400">Total</span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold uppercase tracking-wide">
              <div className="flex-1 bg-amber-50 text-amber-600 px-2.5 py-1.5 rounded-lg border border-amber-100 flex justify-between items-center">
                <span>⏳ Waiting</span>
                <span className="text-xs">{metrics.opdWaiting}</span>
              </div>
              <div className="flex-1 bg-emerald-50 text-emerald-600 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex justify-between items-center">
                <span>✓ Done</span>
                <span className="text-xs">{metrics.opdCompleted}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">IPD Occupancy</span>
            <span className="text-purple-600 text-lg">🛏️</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#0e1e38] tracking-tight">
              {metrics.ipdOccupied}<span className="text-xl font-normal text-gray-400">/{metrics.ipdTotal}</span>
            </h2>
            <p className="text-xs text-teal-600 font-semibold mt-2">{Math.round((metrics.ipdOccupied / metrics.ipdTotal) * 100)}% occupied</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Revenue Today</span>
            <span className="text-emerald-600 text-lg">📈</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#0e1e38] tracking-tight transition-all duration-300">₹{metrics.revenueToday.toLocaleString("en-IN")}</h2>
            <p className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">↑ {metrics.revenueTrend}% <span className="text-gray-400 font-normal">vs yesterday</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pending Bills</span>
            <span className="text-amber-600 text-lg">🧾</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#0e1e38] tracking-tight transition-all duration-300">{metrics.pendingBillsCount}</h2>
            <p className="text-[11px] text-amber-600 font-medium mt-2">₹{metrics.pendingBillsAmount.toLocaleString("en-IN")} outstanding</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* INLINE LIVE CONSULTATION QUEUE TABLE */}
        <div className="bg-white border border-[#eadecc] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white">
            <h3 className="text-xl font-bold text-[#0e1e38] font-serif">Live Consultation Queue Ledger</h3>
            <p className="text-xs text-gray-400 mt-0.5">Chronological waiting room list ordered dynamically by system payment timestamps.</p>
          </div>
          
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#fcfaf4] border-b border-[#eadecc] text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <th className="p-4 whitespace-nowrap">Staged Timestamp</th>
                  <th className="p-4 whitespace-nowrap">Outpatient Identity File</th>
                  <th className="p-4 whitespace-nowrap">Assigned Consultant</th>
                  <th className="p-4 whitespace-nowrap">Triage Priority</th>
                  <th className="p-4 text-center whitespace-nowrap">Room Call Actions</th>
                  <th className="p-4 text-center whitespace-nowrap">Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600 bg-white">
                {liveQueueData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 font-medium italic">
                      No active paid outpatients currently waiting in queue.
                    </td>
                  </tr>
                ) : (
                  liveQueueData.map((item) => (
                    <tr key={item._id} className={`hover:bg-slate-50/60 transition-colors ${item.checkupStatus === 'called' ? 'bg-amber-50/30' : ''}`}>
                      <td className="p-4 font-mono font-bold text-[#0f6266] whitespace-nowrap">{item.createdAt}</td>
                      
                      {/* FIXED: Patient Name now routes to their clinical workspace page */}
                      <td className="p-4">
                        <button 
                          onClick={() => router.push(`/patient/${item.patientId}`)}
                          className="font-bold text-[#0e1e38] hover:text-[#0f6266] hover:underline whitespace-nowrap cursor-pointer text-left"
                        >
                          {item.patientName}
                        </button>
                        <p className="text-[10px] text-gray-400 font-mono whitespace-nowrap">ID: {item.patientId}</p>
                      </td>

                      <td className="p-4 text-slate-700 font-medium whitespace-nowrap"> {item.doctorName}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          item.triageStatus === 'Emergency' ? 'bg-red-50 text-red-500 border border-red-100' :
                          item.triageStatus === 'Review' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          ● {item.triageStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleCallPatient(item)}
                          disabled={callingId === item._id || item.checkupStatus === 'called'}
                          className={`font-bold text-[11px] px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer ${
                            item.checkupStatus === 'called'
                              ? 'bg-amber-500 text-white cursor-not-allowed'
                              : 'bg-[#0f6266] text-white hover:bg-[#0b4a4d]'
                          }`}
                        >
                          {item.checkupStatus === 'called' ? '⚡ Patient Called' : '📢 Room Call'}
                        </button>
                      </td>

                      {/* FIXED: Edit Meds button now routes to the patient page with an action parameter */}
                      <td className="p-4 text-center whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleRemovePatient(item._id)}
                          disabled={processingId === item._id}
                          className="font-bold text-[11px] px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                          title="Remove from Queue"
                        >
                          ✓ Remove
                        </button>
                        <button
                          onClick={() => router.push(`/patient/${item.patientId}?action=edit-meds`)}
                          className="font-bold text-[11px] px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all cursor-pointer shadow-sm"
                          title="Open Patient Profile to Edit Medication"
                        >
                          ✏️ Edit Meds
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DATA INSIGHTS COMPONENT BLOCK */}
        <DashboardInsights queueData={liveQueueData} />
      </div>
    </div>
  );
}