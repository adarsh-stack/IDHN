'use client';

import React from 'react';
import { MedicalEncounter } from '@/app/actions';

interface EncounterDetailViewProps {
  encounter: MedicalEncounter;
  onBack: () => void;
}

export default function EncounterDetailView({ encounter, onBack }: EncounterDetailViewProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#eadecc] p-6 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Top Controls Bar */}
      <div className="flex justify-between items-center border-b border-gray-150 pb-4">
        <div>
          <button onClick={onBack} className="text-xs font-bold text-[#0f6266] hover:underline mb-1 cursor-pointer flex items-center gap-1">
            ← Return to History List
          </button>
          <h2 className="text-xl font-bold text-[#0e1e38] font-serif">Clinical Encounter Summary</h2>
        </div>
        <div className="text-right text-xs font-mono text-gray-400">
          <p>Date: {encounter.date}</p>
          <p>Consultant: Dr. {encounter.doctorName}</p>
        </div>
      </div>

      {/* Grid of historic vitals matched at appointment slot */}
      {encounter.vitalsSnapshot && (
        <div className="bg-[#fcfaf4] border border-[#eadecc] p-4 rounded-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Encounter Intake Vitals</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white border border-[#eadecc]/60 p-2.5 rounded-lg">
              <span className="block text-[10px] text-gray-400 font-bold uppercase">Blood Pressure</span>
              <span className="text-sm font-mono font-bold text-slate-700">{encounter.vitalsSnapshot.bloodPressure} <span className="text-[10px] font-normal text-gray-400">mmHg</span></span>
            </div>
            <div className="bg-white border border-[#eadecc]/60 p-2.5 rounded-lg">
              <span className="block text-[10px] text-gray-400 font-bold uppercase">Pulse Rate</span>
              <span className="text-sm font-mono font-bold text-teal-600">{encounter.vitalsSnapshot.pulseRate} <span className="text-[10px] font-normal text-gray-400">BPM</span></span>
            </div>
            <div className="bg-white border border-[#eadecc]/60 p-2.5 rounded-lg">
              <span className="block text-[10px] text-gray-400 font-bold uppercase">Temperature</span>
              <span className="text-sm font-mono font-bold text-amber-600">{encounter.vitalsSnapshot.temperature} <span className="text-[10px] font-normal text-gray-400">°F</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis & Direct Clinical Treatment Notes */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Primary Diagnosis</h4>
          <p className="text-sm font-bold text-slate-800 bg-red-50/50 border border-red-100/60 px-3 py-2 rounded-lg inline-block">
            🎯 {encounter.diagnosis}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Prescribed Treatment / Medications</h4>
          <ul className="space-y-1.5">
            {encounter.medications.map((med, i) => (
              <li key={i} className="text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-2 rounded-lg flex items-center gap-2">
                💊 {med}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Consultation & Progress Notes</h4>
          <p className="text-xs text-gray-600 leading-relaxed bg-[#fcfaf4] p-4 rounded-xl border border-[#eadecc]/60">
            {encounter.clinicalNotes}
          </p>
        </div>
      </div>
    </div>
  );
}