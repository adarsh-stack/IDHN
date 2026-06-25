'use client';

import React from 'react';
import { QueueItem } from '@/app/actions';

interface DashboardInsightsProps {
  queueData: QueueItem[];
}

export default function DashboardInsights({ queueData }: DashboardInsightsProps) {
  const totalWaiting = queueData.length;
  const emergencies = queueData.filter(q => q.triageStatus === 'Emergency').length;
  const reviews = queueData.filter(q => q.triageStatus === 'Review').length;
  const normalCount = totalWaiting - (emergencies + reviews);

  return (
    <div className="bg-white border border-[#eadecc] p-6 rounded-2xl shadow-sm space-y-5">
      <div>
        <h3 className="text-base font-bold text-[#0e1e38] font-serif">Whole Data Insights Portal</h3>
        <p className="text-xs text-gray-400 mt-0.5">Live statistical metrics for clinic workflows and operational flow analysis.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Triage Mix */}
        <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Critical Triage Mix</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-red-500">{emergencies}</span>
            <span className="text-xs text-gray-400 font-medium">Emergencies active</span>
          </div>
          <div className="w-full bg-gray-150 h-1.5 rounded-full mt-3 overflow-hidden flex">
            <div className="bg-red-500 h-full" style={{ width: `${totalWaiting ? (emergencies/totalWaiting)*100 : 0}%` }} />
            <div className="bg-emerald-500 h-full" style={{ width: `${totalWaiting ? (normalCount/totalWaiting)*100 : 0}%` }} />
          </div>
        </div>

        {/* Metric 2: Clinic Load Factors */}
        <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Waiting Room Density</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-[#0f6266]">{totalWaiting}</span>
            <span className="text-xs text-gray-400 font-medium">Outpatients staged</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 font-medium">
            ℹ Normal Triage: <span className="font-bold">{normalCount}</span> • Reviews: <span className="font-bold">{reviews}</span>
          </p>
        </div>

        {/* Metric 3: Active Flow Vectors */}
        <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Queue Efficiency Tiers</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-amber-500">
              {queueData.filter(q => q.checkupStatus === 'called').length}
            </span>
            <span className="text-xs text-gray-400 font-medium">Patients inside rooms</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Live Broadcast Stream</span>
          </div>
        </div>

        {/* Metric 4: Direct Accounting Link */}
        <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Staged Value Registry</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-slate-700">
              ₹{queueData.reduce((acc, q) => acc + q.amount, 0)}
            </span>
            <span className="text-xs text-gray-400 font-medium">Paid pipeline values</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-3">✓ 100% Cleared Accounts</p>
        </div>

      </div>
    </div>
  );
}