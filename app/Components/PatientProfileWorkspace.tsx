"use client";

import React, { useEffect, useState } from "react";
import {
  fetchPatientClinicalHistory,
  submitNursingVitals,
  linkPatientAadhaar, 
  PatientRecord,
  PatientVitals,
  MedicalEncounter,
} from "@/app/actions";
import EncounterLogsTimeline from './EncounterLogsTimeline';

interface PatientProfileWorkspaceProps {
  patient: PatientRecord;
  onBack: () => void;
}

export default function PatientProfileWorkspace({
  patient,
  onBack,
}: PatientProfileWorkspaceProps) {
  // Data States
  const [history, setHistory] = useState<{
    vitalsHistory: PatientVitals[];
    encounters: MedicalEncounter[];
  }>({ vitalsHistory: [], encounters: [] });
  
  // UI View States
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Aadhaar Linking States
  const [aadhaarInput, setAadhaarInput] = useState<string>("");
  const [linkingLoader, setLinkingLoader] = useState<boolean>(false);
  const [isLinkedLocal, setIsLinkedLocal] = useState<boolean>(patient.abhaLinked);

  const loadProfileHistory = async () => {
    if (patient._id) {
      const res = await fetchPatientClinicalHistory(patient._id);
      if (res.success) {
        setHistory({
          vitalsHistory: res.vitalsHistory,
          encounters: res.encounters,
        });
      }
    }
  };

  useEffect(() => {
    loadProfileHistory();
  }, [patient._id]);

  const handleCommitLink = async () => {
    if (!aadhaarInput || aadhaarInput.trim().length < 12) {
      return alert("Please enter a valid 12-digit structural identification sequence.");
    }

    setLinkingLoader(true);
    const res = await linkPatientAadhaar(patient._id!, aadhaarInput);
    setLinkingLoader(false);

    if (res.success) {
      setIsLinkedLocal(true);
      alert(res.message);
      loadProfileHistory(); // Sync background pipelines
    } else {
      alert(res.message);
    }
  };

  const handleVitalsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFormMsg(null);

    const fData = new FormData(e.currentTarget);
    const payload = {
      patientId: patient._id!,
      date: new Date().toLocaleDateString("en-GB"),
      bloodPressure: fData.get("bp") as string,
      pulseRate: Number(fData.get("pulse")),
      temperature: Number(fData.get("temp")),
      weight: Number(fData.get("weight")),
      height: Number(fData.get("height")),
      sugar: Number(fData.get("sugar")),
      recordedBy: "Nurse Station Alpha",
    };

    const res = await submitNursingVitals(payload);
    setLoading(false);
    
    if (res.success) {
      setFormMsg("✓ Vitals logged.");
      e.currentTarget.reset();
      loadProfileHistory();
    } else {
      setFormMsg("❌ Error committing logs.");
    }
  };

  return (
    <div className="p-6 bg-[#fcfaf4] space-y-6 text-slate-800 relative">
      
      {/* 1. Profile Header Block */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white border border-[#eadecc] p-5 rounded-2xl shadow-sm gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-[#0f6266] hover:underline mb-1 cursor-pointer"
          >
            ← Back to Patient Roster
          </button>
          <h2 className="text-2xl font-bold font-serif text-[#0e1e38]">
            {patient.name}
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            MRN: {patient.mrn} • Age: {patient.age} • Gender: {patient.gender} • Mobile: {patient.phone || 'Not Provided'}
          </p>
        </div>
        
        {/* Right Header Actions: Aadhaar Linking */}
        <div className="flex items-center gap-4 self-start md:self-auto">
          
          {/* Conditional Input Box */}
          {!isLinkedLocal && (
            <div className="flex items-center bg-[#fcfaf4] border border-[#eadecc] rounded-xl p-1 shadow-inner animate-in fade-in duration-200">
              <input
                type="text"
                maxLength={12}
                placeholder="Enter 12-digit Aadhaar"
                value={aadhaarInput}
                onChange={(e) => setAadhaarInput(e.target.value.replace(/[^0-9]/g, ""))}
                className="bg-transparent px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none w-40"
                disabled={linkingLoader}
              />
              <button
                onClick={handleCommitLink}
                disabled={linkingLoader || aadhaarInput.length < 12}
                className="bg-[#0f6266] hover:bg-[#0b4a4d] disabled:bg-slate-300 text-white font-bold text-[10px] px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              >
                {linkingLoader ? "Verifying..." : "Link ID"}
              </button>
            </div>
          )}

          {/* Status Indicator Badge */}
          <div
            className={`px-4 py-2 rounded-xl text-center shadow-sm min-w-[140px] transition-all border ${
              isLinkedLocal
                ? "bg-emerald-50/80 border-emerald-200"
                : "bg-[#eaf8f9] border-[#d8f3f5]"
            }`}
          >
            <span
              className={`block text-[9px] font-bold uppercase ${
                isLinkedLocal ? "text-emerald-700" : "text-[#006677]"
              }`}
            >
              Aadhaar Sync Status
            </span>
            <span
              className={`text-xs font-bold ${
                isLinkedLocal ? "text-emerald-600" : "text-[#0f6266]"
              }`}
            >
              {isLinkedLocal ? "VERIFIED ✓" : "UNLINKED"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Live Nurse Intake Form */}
        <div className="bg-white border border-[#eadecc] p-5 rounded-2xl shadow-sm h-fit">
          <h3 className="text-sm font-bold text-[#0e1e38] font-serif mb-1">
            New Capture Intake
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Record real-time vitals for the active outpatient triage slot.
          </p>

          {formMsg && (
            <div className="p-2 mb-3 text-xs font-bold text-center bg-slate-50 border rounded-lg">
              {formMsg}
            </div>
          )}

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
              <input type="number" step="0.1" name="weight" placeholder="60" required className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Height (cm) *</label>
              <input type="number" step="0.1" name="height" placeholder="165" required className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Sugar</label>
              <input type="number" step="0.1" name="sugar" placeholder="110" required className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f6266] hover:bg-[#0b4a4d] text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors mt-2"
            >
              {loading ? "Recording..." : "Commit Station Vitals"}
            </button>
          </form>
        </div>

        {/* Column 2 & 3 Right Hand Area: Charts & Encounter Log lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Graphical Analytics Component Area */}
          <div className="bg-white border border-[#eadecc] p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-[#0e1e38] font-serif mb-1">
              Vitals Trend Metrics
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Historical tracking map of pulse rate metrics recorded over time.
            </p>

            {history.vitalsHistory.length < 2 ? (
              <div className="h-32 flex items-center justify-center text-xs text-gray-400 font-medium bg-[#fcfaf4] rounded-xl border border-dashed border-gray-200">
                Register at least 2 separate vital entry logs to render progression vectors.
              </div>
            ) : (
              <div className="bg-[#fcfaf4] p-4 rounded-xl border border-[#eadecc]/60">
                <svg viewBox="0 0 400 120" className="w-full h-32 overflow-visible">
                  <g className="text-[9px] fill-gray-400 font-mono">
                    <text x="0" y="15">120 BPM</text>
                    <text x="0" y="60">80 BPM</text>
                    <text x="0" y="110">40 BPM</text>
                  </g>
                  <path
                    d={`M ${history.vitalsHistory.map((v, idx) => `${40 + idx * (340 / (history.vitalsHistory.length - 1))},${120 - (v.pulseRate - 40) * (100 / 80)}`).join(" L ")}`}
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

          {/* Chronological Encounter Logs Timeline Card */}
          <EncounterLogsTimeline encounters={history.encounters} />

        </div>
      </div>
    </div>
  );
}