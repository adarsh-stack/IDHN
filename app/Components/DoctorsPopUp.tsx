"use client";

import React, { useEffect, useState } from "react";
import { fetchAllStaff } from "@/app/actions/profileActions"; 

interface StaffDirectoryPopupProps {
  isOpen: boolean;
}

export default function DoctorsPopUp({ isOpen }: StaffDirectoryPopupProps) {
  const [loading, setLoading] = useState(true);
  const [directory, setDirectory] = useState({
    doctors: [] as any[],
    receptionists: [] as any[],
    pharmacists: [] as any[],
  });

  useEffect(() => {
    async function loadDirectory() {
      if (!isOpen) return; 
      
      setLoading(true);
      const res = await fetchAllStaff();
      
      if (res.success && res.data) {
        
        setDirectory({
          doctors: res.data.filter((s: any) => s.role === "Doctor"),
          receptionists: res.data.filter((s: any) => s.role === "Receptionist"),
          pharmacists: res.data.filter((s: any) => s.role === "Pharmacy"),
        });
      }
      setLoading(false);
    }

    loadDirectory();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    
    <div className="absolute top-full left-0 mt-3 w-72 bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl z-[6000] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
      
     
      <div className="p-4 border-b border-gray-800 bg-[#161b22] relative z-10">
        <h3 className="text-[#00d8b6] text-[11px] font-bold tracking-[0.2em] uppercase">
          Practitioner Directory
        </h3>
      </div>

      
      <div className="max-h-60 overflow-y-auto p-4 custom-scrollbar bg-[#161b22]">
        
        {loading ? (
          <div className="text-gray-500 text-xs text-center py-4 animate-pulse">
            Syncing database...
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. DOCTORS SECTION */}
            {directory.doctors.length > 0 && (
              <div>
                <h4 className="text-[#0f6266] text-[10px] font-bold tracking-widest uppercase mb-3 border-b border-gray-800/50 pb-1">
                  Physicians & Specialists
                </h4>
                <div className="space-y-3">
                  {directory.doctors.map((doc) => (
                    <div key={doc._id} className="group cursor-pointer hover:bg-gray-800/40 p-1.5 -mx-1.5 rounded-lg transition-colors">
                      <p className="text-white text-sm font-bold group-hover:text-[#00d8b6] transition-colors">
                        {doc.name}
                      </p>
                      <p className="text-gray-500 text-[10px] font-mono mt-0.5">
                        {doc.email || "No email provided"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. RECEPTIONISTS SECTION */}
            {directory.receptionists.length > 0 && (
              <div>
                <h4 className="text-[#0f6266] text-[10px] font-bold tracking-widest uppercase mb-3 border-b border-gray-800/50 pb-1">
                  Front Desk / Reception
                </h4>
                <div className="space-y-3">
                  {directory.receptionists.map((rec) => (
                    <div key={rec._id} className="group cursor-pointer hover:bg-gray-800/40 p-1.5 -mx-1.5 rounded-lg transition-colors">
                      <p className="text-white text-sm font-bold group-hover:text-[#00d8b6] transition-colors">
                        {rec.name}
                      </p>
                      <p className="text-gray-500 text-[10px] font-mono mt-0.5">
                        {rec.location || "General Reception"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PHARMACISTS SECTION */}
            {directory.pharmacists.length > 0 && (
              <div>
                <h4 className="text-[#0f6266] text-[10px] font-bold tracking-widest uppercase mb-3 border-b border-gray-800/50 pb-1">
                  Central Dispensary
                </h4>
                <div className="space-y-3">
                  {directory.pharmacists.map((pharm) => (
                    <div key={pharm._id} className="group cursor-pointer hover:bg-gray-800/40 p-1.5 -mx-1.5 rounded-lg transition-colors">
                      <p className="text-white text-sm font-bold group-hover:text-[#00d8b6] transition-colors">
                        {pharm.name}
                      </p>
                      <p className="text-gray-500 text-[10px] font-mono mt-0.5">
                        {pharm.email || "Pharmacist"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State Fallback */}
            {directory.doctors.length === 0 && directory.receptionists.length === 0 && directory.pharmacists.length === 0 && (
               <p className="text-gray-500 text-xs italic">No staff found in database.</p>
            )}

          </div>
        )}
      </div>
    </div>
  );
}