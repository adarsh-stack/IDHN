'use client';

import React, { useEffect, useState } from 'react';
import { fetchPatientClinicalHistory, submitNursingVitals, PatientRecord, PatientVitals, MedicalEncounter } from '@/app/actions';
import EncounterDetailView from './EncounterDetailVeiw';

interface PatientProfileWorkspaceProps {
  patient: PatientRecord;
  onBack: () => void;
}

export default function PatientProfileWorkspace({ patient, onBack }: PatientProfileWorkspaceProps) {
  const [history, setHistory] = useState<{ vitalsHistory: PatientVitals[]; encounters: MedicalEncounter[] }>({ vitalsHistory: [], encounters: [] });
  const [selectedEncounter, setSelectedEncounter] = useState<MedicalEncounter | null>(null);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadProfileHistory = async () => {
    if (patient._id) {
      const res = await fetchPatientClinicalHistory(patient._id);
      if (res.success) setHistory({ vitalsHistory: res.vitalsHistory, encounters: res.encounters });
    }
  };

  useEffect(() => {
    loadProfileHistory();
  }, [patient._id]);

  const handleVitalsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFormMsg(null);

    const fData = new FormData(e.currentTarget);
    const payload = {
      patientId: patient._id!,
      date: new Date().toLocaleDateString('en-GB'),
      bloodPressure: fData.get('bp') as string,
      pulseRate: Number(fData.get('pulse')),
      temperature: Number(fData.get('temp')),
      weight: Number(fData.get('weight')),
      height: Number(fData.get('height')),
      sugar: Number(fData.get('sugar')),
      recordedBy: 'Nurse Station Alpha'
    };

    const res = await submitNursingVitals(payload);
    setLoading(false);
    if (res.success) {
      setFormMsg('✓ Vitals logged.');
      e.currentTarget.reset();
      loadProfileHistory();
    } else {
      setFormMsg('❌ Error committing logs.');
    }
  };

  // If a detail button is clicked, switch view context right inside the workspace container
  if (selectedEncounter) {
    return <EncounterDetailView encounter={selectedEncounter} onBack={() => setSelectedEncounter(null)} />;
  }

  return (
    <div className="p-6 bg-[#fcfaf4] space-y-6 text-slate-800">
      {/* Profile Header Block */}
      <div className="flex justify-between items-center bg-white border border-[#eadecc] p-5 rounded-2xl shadow-sm">
        <div>
          <button onClick={onBack} className="text-xs font-bold text-[#0f6266] hover:underline mb-1 cursor-pointer">
            ← Back to Patient Roster
          </button>
          <h2 className="text-2xl font-bold font-serif text-[#0e1e38]">{patient.name}</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">MRN: {patient.mrn} • Age: {patient.age} • Gender: {patient.gender}</p>
        </div>
        <div className="bg-[#eaf8f9] border border-[#d8f3f5] px-4 py-2 rounded-xl text-center">
          <span className="block text-[10px] font-bold text-[#006677] uppercase">ABHA Sync Status</span>
          <span className="text-xs font-bold text-[#0f6266]">{patient.abhaLinked ? 'CONNECTED ✓' : 'UNLINKED'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Live Nurse Intake Form */}
        <div className="bg-white border border-[#eadecc] p-5 rounded-2xl shadow-sm h-fit">
          <h3 className="text-sm font-bold text-[#0e1e38] font-serif mb-1">New Capture Intake</h3>
          <p className="text-xs text-gray-400 mb-4">Record real-time vitals for the active outpatient triage slot.</p>
          
          {formMsg && <div className="p-2 mb-3 text-xs font-bold text-center bg-slate-50 border rounded-lg">{formMsg}</div>}

          <form onSubmit={handleVitalsSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Blood Pressure (mmHg) *</label>
              <input type="text" name="bp" placeholder="120/80" required className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Pulse Rate (BPM) *</label>
              <input type="number" name="pulse" placeholder="72" required className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Temperature (°F) *</label>
              <input type="number" step="0.1" name="temp" placeholder="98.6" required className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Weight (kg) *</label>
              <input type="number" step="0.1" name="weight" placeholder="60 " required className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Height (cm) *</label>
              <input type="number" step="0.1" name="height" placeholder="165" required className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Sugar </label>
              <input type="number" step="0.1" name="sugar" placeholder="110" required className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#0f6266] hover:bg-[#0b4a4d] text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors mt-2">
              {loading ? 'Recording...' : 'Commit Station Vitals'}
            </button>
          </form>
        </div>

        {/* Column 2 & 3 Right Hand Area: Charts & Encounter Log lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Graphical Analytics Component Area */}
          <div className="bg-white border border-[#eadecc] p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-[#0e1e38] font-serif mb-1">Vitals Trend Metrics</h3>
            <p className="text-xs text-gray-400 mb-4">Historical tracking map of pulse rate metrics recorded over time.</p>
            
            {history.vitalsHistory.length < 2 ? (
              <div className="h-32 flex items-center justify-center text-xs text-gray-400 font-medium bg-[#fcfaf4] rounded-xl border border-dashed border-gray-200">
                Register at least 2 separate vital entry logs to render progression vectors.
              </div>
            ) : (
              /* Custom SVG Linear Progression Chart Line */
              <div className="bg-[#fcfaf4] p-4 rounded-xl border border-[#eadecc]/60">
                <svg viewBox="0 0 400 120" className="w-full h-32 overflow-visible">
                  <g className="text-[9px] fill-gray-400 font-mono">
                    <text x="0" y="15">120 BPM</text>
                    <text x="0" y="60">80 BPM</text>
                    <text x="0" y="110">40 BPM</text>
                  </g>
                  {/* Vector path calculations mapping historical arrays dynamically */}
                  <path
                    d={`M ${history.vitalsHistory.map((v, idx) => `${40 + (idx * (340 / (history.vitalsHistory.length - 1)))},${120 - ((v.pulseRate - 40) * (100 / 80))}`).join(' L ')}`}
                    fill="none"
                    stroke="#0f6266"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex justify-between px-8 text-[9px] font-bold text-gray-400 font-mono mt-1">
                  <span>First Log</span>
                  <span>Latest Update</span>
                </div>
              </div>
            )}
          </div>

          {/* Chronological Encounter Lists */}
          <div className="bg-white border border-[#eadecc] p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-[#0e1e38] font-serif mb-3">Encounter Logs Timeline</h3>
            {history.encounters.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No recorded clinical historical evaluations on file.</p>
            ) : (
              <div className="space-y-3">
                {history.encounters.map((enc) => (
                  <div key={enc._id} className="flex items-center justify-between p-3.5 bg-[#fcfaf4] border border-[#eadecc]/60 rounded-xl hover:border-[#0f6266]/40 transition-colors">
                    <div className="space-y-0.5">
                      <span className="inline-block text-[9px] font-mono font-bold bg-[#0f6266]/10 text-[#0f6266] px-1.5 py-0.5 rounded">
                        {enc.date}
                      </span>
                      <h4 className="text-xs font-bold text-[#0e1e38] pt-1">Consulted with Dr. {enc.doctorName}</h4>
                      <p className="text-[11px] text-gray-500 italic">Dx Focus: {enc.diagnosis}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedEncounter(enc)}
                      className="bg-white border border-[#0f6266] text-[#0f6266] hover:bg-[#0f6266] hover:text-white transition-all text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer shadow-sm"
                    >
                      Detail Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}