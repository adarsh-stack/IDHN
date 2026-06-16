'use client';

import React from 'react';
import { GroupedDoctors } from '@/app/actions';

interface DoctorsPopupProps {
  data: GroupedDoctors[];
  onClose: () => void;
}

export default function DoctorsPopup({ data, onClose }: DoctorsPopupProps) {
  return (
    <div className="absolute right-0 md:right-auto md:left-0 top-12 w-80 sm:w-96 bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl p-5 z-[3000] text-white">
      {/* Top Header Label */}
      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">Practitioner Directory</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm cursor-pointer">✕</button>
      </div>

      {data.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No active practitioners on this cluster node.</p>
      ) : (
        /* Scrollable layout wrapper */
        <div className="max-h-72 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {data.map((group) => (
            <div key={group._id} className="space-y-1.5">
              {/* Department Group Label Header */}
              <h4 className="text-[11px] font-bold text-teal-500/80 uppercase tracking-wide bg-teal-950/20 px-2 py-0.5 rounded border border-teal-950/30">
                {group._id}
              </h4>
              
              {/* Nested Doctor Names Roster */}
              <ul className="space-y-1 pl-2">
                {group.doctors.map((doc) => (
                  <li key={doc.id} className="group flex flex-col py-1 border-b border-zinc-900/40 last:border-0">
                    <span className="text-xs font-semibold text-gray-200 group-hover:text-teal-400 transition-colors">
                      {doc.name}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono select-all">
                      {doc.email}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}