'use client';

import React, { useState } from 'react';
import EncounterDetailModal from './EncounterDetailModal';

interface EncounterLogsTimelineProps {
  encounters: any[];
}

export default function EncounterLogsTimeline({ encounters }: EncounterLogsTimelineProps) {
  // State to track which encounter is currently being viewed in the modal
  const [viewingEncounter, setViewingEncounter] = useState<any | null>(null);

  return (
    <div className="bg-white border border-[#eadecc] rounded-2xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-[#0e1e38] font-serif mb-4 border-b border-gray-100 pb-3">
        Encounter Logs Timeline
      </h3>
      
      <div className="space-y-4">
        {encounters.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No past encounters recorded for this patient.</p>
        ) : (
          encounters.map((enc, idx) => (
            <div 
              key={enc._id || idx} 
              className="bg-[#fcfaf4] border border-[#eadecc] p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-[#0f6266]/10 text-[#0f6266] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {enc.date}
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    Consultant: Dr. {enc.doctorName}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#0e1e38]">
                  Reason: <span className="text-[#0f6266]">{enc.reasonToVisit || 'General Evaluation'}</span>
                </p>
              </div>
              
              <button 
                onClick={() => setViewingEncounter(enc)}
                className="text-xs font-bold text-[#0f6266] border border-[#0f6266] px-4 py-2 rounded-xl hover:bg-[#0f6266] hover:text-white transition-colors cursor-pointer shadow-sm shrink-0"
              >
                Detailed History Sheet
              </button>
            </div>
          ))
        )}
      </div>

      {/* Renders the modal overlay only when a specific encounter is selected */}
      {viewingEncounter && (
        <EncounterDetailModal 
          encounter={viewingEncounter} 
          onClose={() => setViewingEncounter(null)} 
        />
      )}
    </div>
  );
}