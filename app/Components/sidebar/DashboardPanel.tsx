'use client';

import React, { useEffect, useState } from 'react';
import { fetchDashboardMetrics, DashboardMetrics } from '@/app/actions';

interface UserSession {
  name: string;
}

const DashboardPanel = ()=> {
  const [userName, setUserName] = useState<string>('Dr. Sharma');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    // 1. Get Logged-In User Name from session state
    const sessionStr = localStorage.getItem('idhn_session');
    if (sessionStr) {
      const session: UserSession = JSON.parse(sessionStr);
      setUserName(session.name);
    }

    // 2. Format localized system date string
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-IN', options));

    // 3. Fetch analytics live from MongoDB
    fetchDashboardMetrics().then((res) => {
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    });
  }, []);

  if (!metrics) {
    return <div className="p-8 text-gray-500 font-medium animate-pulse">Gathering core clinical metrics...</div>;
  }

  return (
    <div className="p-8 bg-[#fcfaf4] font-sans">
      {/* Header Profile Greeting Panel */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#0e1e38] font-serif">
          Good morning, {userName}
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          {currentDate} •  Multi-Speciality Hospital System
        </p>
      </div>

      {/* Analytics Card Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Today's OPD */}
        <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Today's OPD</span>
            <span className="text-teal-600 text-lg">👤</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#0e1e38] tracking-tight">{metrics.todaysOpd}</h2>
            <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              ↑ {metrics.opdTrend}% <span className="text-gray-400 font-normal">vs yesterday</span>
            </p>
          </div>
        </div>

        {/* Card 2: IPD Occupancy */}
        <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">IPD Occupancy</span>
            <span className="text-purple-600 text-lg">🛏️</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#0e1e38] tracking-tight">
              {metrics.ipdOccupied}<span className="text-xl font-normal text-gray-400">/{metrics.ipdTotal}</span>
            </h2>
            <p className="text-xs text-teal-600 font-semibold mt-2">
              {Math.round((metrics.ipdOccupied / metrics.ipdTotal) * 100)}% occupied
            </p>
          </div>
        </div>

        {/* Card 3: Revenue Today */}
        <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Revenue Today</span>
            <span className="text-emerald-600 text-lg">📈</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#0e1e38] tracking-tight">
              ₹{metrics.revenueToday.toLocaleString('en-IN')}
            </h2>
            <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              ↑ {metrics.revenueTrend}% <span className="text-gray-400 font-normal">vs yesterday</span>
            </p>
          </div>
        </div>

        {/* Card 4: Pending Bills */}
        <div className="bg-white p-5 rounded-2xl border border-[#eadecc] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pending Bills</span>
            <span className="text-amber-600 text-lg">🧾</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#0e1e38] tracking-tight">{metrics.pendingBillsCount}</h2>
            <p className="text-xs text-amber-600 font-medium mt-2">
              ₹{metrics.pendingBillsAmount.toLocaleString('en-IN')} outstanding
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
export default DashboardPanel;