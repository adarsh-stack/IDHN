"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  searchPharmacyInventory,
  fetchLatestVitals,
  fetchPatientDetails,
  saveWorkspaceDraft,
  loadWorkspaceDraft,
  logPatientEncounter,
  fetchPastEncounters,
  updatePatientEncounter,
} from "@/app/actions/workspaceActions";
import { completePatientCheckup } from "@/app/actions/queueActions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 1. IMPORT YOUR SECURITY WRAPPER
// import ProtectedRoute from "@/app/Components/ProtectedRoute";

export default function ClinicalWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [doctorName, setDoctorName] = useState("Attending Doctor");
  const [patient, setPatient] = useState<any | null>(null);
  const [vitals, setVitals] = useState<any | null>(null);
  const [isVitalsLoading, setIsVitalsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Clinical Notes & Prescriptions
  const [reasonToVisit, setReasonToVisit] = useState("");
  const [remarks, setRemarks] = useState("");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [requestedLabs, setRequestedLabs] = useState<string[]>([]);

  // Builder States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any | null>(null);
  const [dosageFreq, setDosageFreq] = useState("1-0-1");
  const [duration, setDuration] = useState("5 Days");
  const [instruction, setInstruction] = useState("After Meal");
  const [labSearch, setLabSearch] = useState("");

  // Historical Encounters
  const [pastEncounters, setPastEncounters] = useState<any[]>([]);
  const [editingEncounter, setEditingEncounter] = useState<any | null>(null);

  // 1. INITIAL MOUNT & HYDRATION
  useEffect(() => {
    const sessionStr = localStorage.getItem("idhn_session");
    if (sessionStr) {
      try {
        setDoctorName(JSON.parse(sessionStr).name);
      } catch (e) {}
    }

    async function loadWorkspaceData() {
      if (!patientId) return;

      // Fetch Patient & Vitals
      const pRes = await fetchPatientDetails(patientId);
      if (pRes.success) setPatient(pRes.data);
      const vRes = await fetchLatestVitals(patientId);
      if (vRes.success) setVitals(vRes.data);
      setIsVitalsLoading(false);

      // Fetch Past Encounters
      const encRes = await fetchPastEncounters(patientId);
      if (encRes.success) setPastEncounters(encRes.data);

      // Hydrate Draft State
      const draftRes = await loadWorkspaceDraft(patientId);
      if (draftRes.success && draftRes.data) {
        setReasonToVisit(draftRes.data.reasonToVisit || "");
        setRemarks(draftRes.data.remarks || "");
        setPrescriptions(draftRes.data.prescriptions || []);
        setRequestedLabs(draftRes.data.requestedLabs || []);
      }
    }
    loadWorkspaceData();
  }, [patientId]);

  // 2. LIVE PHARMACY SEARCH
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        const res = await searchPharmacyInventory(searchQuery);
        if (res.success) setSearchResults(res.data);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // --- ACTIONS ---
  const handleSelectMed = (med: any) => {
    if (med.stock <= 0) return alert("Medication is out of stock.");
    setSelectedMed(med);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAddPrescription = () => {
    if (!selectedMed) return;
    setPrescriptions([
      ...prescriptions,
      { ...selectedMed, frequency: dosageFreq, duration, instruction },
    ]);
    setSelectedMed(null);
  };

  const handleRequestLab = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && labSearch.trim() !== "") {
      e.preventDefault();
      setRequestedLabs([...requestedLabs, labSearch.trim()]);
      setLabSearch("");
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await saveWorkspaceDraft({
      patientId,
      reasonToVisit,
      remarks,
      prescriptions,
      requestedLabs,
    });
    setIsSaving(false);
    alert("✓ Draft successfully saved and synchronized.");
  };

  const handleUpdatePastEncounter = async () => {
    if (!editingEncounter) return;
    setIsSaving(true);
    const res = await updatePatientEncounter(editingEncounter._id, {
      reasonToVisit: editingEncounter.reasonToVisit,
      remarks: editingEncounter.remarks,
    });
    setIsSaving(false);
    if (res.success) {
      alert("Historical record updated successfully.");
      setEditingEncounter(null);
      // Refresh list
      const encRes = await fetchPastEncounters(patientId);
      if (encRes.success) setPastEncounters(encRes.data);
    }
  };

  const handleCompleteAndPrint = async () => {
    if (prescriptions.length === 0 && !reasonToVisit) {
      if (
        !confirm(
          "No primary reason or medications prescribed. Complete checkup?",
        )
      )
        return;
    }

    setIsSaving(true);

    // Archive Encounter
    await logPatientEncounter({
      patientId,
      doctorName,
      reasonToVisit,
      remarks,
      status: "completed",
      vitals: vitals || null,
      prescriptions,
      requestedLabs,
    });

    await completePatientCheckup(patientId);

    // Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("HOSPITAL PRESCRIPTION", 14, 22);
    doc.setFontSize(10);
    const ptName = patient?.name || "Unknown Patient";
    doc.text(`Patient ID: ${patientId}`, 14, 32);
    doc.text(`Name: ${ptName}`, 14, 37);
    doc.text(
      `Age/Gender: ${patient?.age || "--"} / ${patient?.gender || "--"}`,
      14,
      42,
    );
    doc.text(`Consultant: ${doctorName}`, 14, 47);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 52);

    if (vitals) {
      doc.text(
        `Vitals: BP: ${vitals.bloodPressure || "--"} | PR: ${vitals.pulseRate || "--"} | Temp: ${vitals.temperature || "--"}`,
        14,
        62,
      );
    }

    let currentY = 70;
    if (prescriptions.length > 0) {
      doc.setFontSize(14);
      doc.text("Rx - Prescribed Medications", 14, currentY);
      currentY += 5;
      autoTable(doc, {
        startY: currentY,
        head: [["Medicine", "Dosage", "Duration", "Instructions"]],
        body: prescriptions.map((m) => [
          m.name,
          m.frequency,
          m.duration,
          m.instruction,
        ]),
        theme: "grid",
        headStyles: { fillColor: [15, 98, 102] },
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    doc.save(
      `Prescription_${ptName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`,
    );
    setIsSaving(false);

    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  return (
    // 2. WRAP THE ENTIRE UI IN THE PROTECTED ROUTE COMPONENT
    
      <div className="min-h-screen bg-[#fcfaf4] p-4 sm:p-8 text-slate-800 font-sans pb-40 relative">
        {/* 1. TOP HEADER SHELL */}
        <div className="flex justify-between items-end border-b border-[#eadecc] pb-4 mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="text-xs font-bold text-[#0f6266] hover:underline mb-2 cursor-pointer flex items-center gap-1"
            >
              ← Exit Workspace
            </button>
            <h1 className="text-3xl font-bold font-serif text-[#0e1e38]">
              Clinical Consultation
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Active Record:{" "}
              <span className="font-bold text-[#0f6266]">{patientId}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#0e1e38]">
              {patient?.name || "Loading Patient Data..."}
            </p>
            {patient && (
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                Age: {patient.age} • {patient.gender} • Blood:{" "}
                {patient.bloodGroup} • Ph: {patient.phone}
              </p>
            )}
          </div>
        </div>

        {/* 2. LIVE VITALS MONITOR */}
        <div className="bg-white border border-[#eadecc] rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Latest Triage Vitals
            </h3>
            {vitals && (
              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 animate-pulse">
                Recorded {vitals.date || "Recently"}
              </span>
            )}
          </div>

          {isVitalsLoading ? (
            <div className="h-16 flex items-center justify-center text-xs text-gray-400 font-medium animate-pulse">
              Syncing triage records from database...
            </div>
          ) : vitals ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                  Blood Pressure
                </p>
                <p className="text-xl font-mono font-bold text-red-500">
                  {vitals.bloodPressure}{" "}
                  <span className="text-[10px] text-gray-400">mmHg</span>
                </p>
              </div>
              <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                  Heart Rate
                </p>
                <p className="text-xl font-mono font-bold text-[#0f6266]">
                  {vitals.pulseRate}{" "}
                  <span className="text-[10px] text-gray-400">BPM</span>
                </p>
              </div>
              <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                  Temperature
                </p>
                <p className="text-xl font-mono font-bold text-amber-500">
                  {vitals.temperature}{" "}
                  <span className="text-[10px] text-gray-400">°F</span>
                </p>
              </div>
              <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                  Blood Sugar
                </p>
                <p className="text-xl font-mono font-bold text-blue-500">
                  {vitals.sugar || "--"}{" "}
                  <span className="text-[10px] text-gray-400">mg/dL</span>
                </p>
              </div>
              <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                  Weight
                </p>
                <p className="text-xl font-mono font-bold text-slate-700">
                  {vitals.weight}{" "}
                  <span className="text-[10px] text-gray-400">kg</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center text-xs text-red-400 bg-red-50 rounded-xl font-medium border border-red-100">
              No vitals recorded for this patient yet.
            </div>
          )}
        </div>

        {/* 3. CLINICAL DIAGNOSIS & NOTES */}
        <div className="bg-white border border-[#eadecc] rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="text-sm font-bold text-[#0e1e38] font-serif mb-4">
            Clinical Diagnosis & Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                Primary Reason for Visit *
              </label>
              <input
                type="text"
                placeholder="e.g., Chronic Migraine Evaluation"
                value={reasonToVisit}
                onChange={(e) => setReasonToVisit(e.target.value)}
                className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0f6266]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                Physician Remarks
              </label>
              <textarea
                placeholder="Detailed clinical notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full h-24 bg-[#fcfaf4] border border-[#eadecc] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0f6266] resize-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: PHARMACY */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#eadecc] rounded-2xl shadow-sm p-5 relative z-20">
              <h3 className="text-base font-bold text-[#0e1e38] font-serif mb-1">
                Prescription Builder
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Search live central dispensary inventory.
              </p>

              <div className="relative mb-4">
                <div className="flex items-center bg-[#fcfaf4] border border-[#eadecc] rounded-xl px-3 py-2.5 shadow-inner">
                  <span className="text-gray-400 mr-2">
                    {isSearching ? "⏳" : "🔍"}
                  </span>
                  <input
                    type="text"
                    placeholder="Search pharmacy stock..."
                    className="w-full bg-transparent text-sm font-bold focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {searchResults.map((med) => (
                      <div
                        key={med._id}
                        onClick={() => handleSelectMed(med)}
                        className="p-3 cursor-pointer hover:bg-slate-50 flex justify-between items-center"
                      >
                        <p className="font-bold text-[#0e1e38] text-sm">
                          {med.name}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${med.stock > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
                        >
                          {med.stock > 0
                            ? `${med.stock} in stock`
                            : "OUT OF STOCK"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedMed && (
                <div className="bg-[#fcfaf4] border border-[#0f6266]/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                    <h4 className="font-bold text-[#0f6266]">
                      💊 {selectedMed.name}
                    </h4>
                    <button
                      onClick={() => setSelectedMed(null)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                        Freq
                      </label>
                      <input
                        type="text"
                        value={dosageFreq}
                        onChange={(e) => setDosageFreq(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                        Instruction
                      </label>
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-xs font-bold"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddPrescription}
                    className="w-full bg-[#0f6266] text-white font-bold text-xs py-2.5 rounded-lg shadow-sm"
                  >
                    + Add to Prescription
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#eadecc] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#eadecc] bg-[#fcfaf4]">
                <h3 className="text-sm font-bold text-[#0e1e38] font-serif">
                  Current Prescribed Medications
                </h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                    <th className="p-3 pl-5">Medicine</th>
                    <th className="p-3">Dosage</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {prescriptions.map((med, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="p-3 pl-5 font-bold text-[#0e1e38]">
                        💊 {med.name}
                      </td>
                      <td className="p-3 font-mono text-[#0f6266] font-bold">
                        {med.frequency}{" "}
                        <span className="font-sans text-gray-500 font-normal">
                          ({med.duration})
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemovePrescription(idx)}
                          className="text-red-400 hover:text-red-600 font-bold"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT COLUMN: LABS & PAST RECORDS */}
          <div className="space-y-6">
            <div className="bg-white border border-[#eadecc] rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#0e1e38] font-serif mb-3">
                Prescribe Labs
              </h3>
              <input
                type="text"
                placeholder="e.g., LFT, X-Ray Chest..."
                value={labSearch}
                onChange={(e) => setLabSearch(e.target.value)}
                onKeyDown={handleRequestLab}
                className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-xl px-3 py-2.5 text-xs focus:outline-none"
              />
              {requestedLabs.map((lab, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-amber-50 border border-amber-100 p-2 rounded-lg mt-2"
                >
                  <span className="text-xs font-bold text-amber-900">
                    🧪 {lab}
                  </span>
                  <button
                    onClick={() =>
                      setRequestedLabs(requestedLabs.filter((_, i) => i !== idx))
                    }
                    className="text-amber-500 font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* HISTORICAL RECORDS BLOCK */}
            <div className="bg-white border border-[#eadecc] rounded-2xl shadow-sm p-5 max-h-[400px] overflow-y-auto custom-scrollbar">
              <h3 className="text-sm font-bold text-[#0e1e38] font-serif mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
                Historical Encounters
              </h3>
              <div className="space-y-3">
                {pastEncounters.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No past encounters found.
                  </p>
                ) : (
                  pastEncounters.map((enc) => (
                    <div
                      key={enc._id}
                      className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3 rounded-xl"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-[10px] font-bold text-[#0f6266]">
                          Dr. {enc.doctorName}
                        </h4>
                        <span className="text-[9px] text-gray-400 font-mono">
                          {enc.date}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#0e1e38] mb-2">
                        {enc.reasonToVisit}
                      </p>
                      <button
                        onClick={() => setEditingEncounter(enc)}
                        className="text-[10px] text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded shadow-sm font-bold hover:bg-blue-100 w-full"
                      >
                        ✏️ Edit Notes
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* EDIT PAST ENCOUNTER MODAL */}
        {editingEncounter && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[5000] p-4">
            <div className="bg-white rounded-2xl p-6 border border-[#eadecc] w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
              <button
                onClick={() => setEditingEncounter(null)}
                className="absolute right-5 top-5 text-gray-400"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-[#0e1e38] font-serif mb-1">
                Edit Historical Log
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Updating encounter from{" "}
                <span className="font-bold">{editingEncounter.date}</span>
              </p>

              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Reason for Visit
              </label>
              <input
                type="text"
                value={editingEncounter.reasonToVisit}
                onChange={(e) =>
                  setEditingEncounter({
                    ...editingEncounter,
                    reasonToVisit: e.target.value,
                  })
                }
                className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-xl px-3 py-2 text-sm font-bold mb-4 focus:outline-none"
              />

              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Physician Remarks
              </label>
              <textarea
                value={editingEncounter.remarks}
                onChange={(e) =>
                  setEditingEncounter({
                    ...editingEncounter,
                    remarks: e.target.value,
                  })
                }
                className="w-full h-24 bg-[#fcfaf4] border border-[#eadecc] rounded-xl p-3 text-sm focus:outline-none resize-none"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setEditingEncounter(null)}
                  className="flex-1 py-2.5 border rounded-lg text-xs font-bold text-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePastEncounter}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-[#e2a83b] text-white rounded-lg text-xs font-bold"
                >
                  {isSaving ? "Updating..." : "Save Update"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HARD SPACER to guarantee scroll clearance */}
        <div className="h-16 w-full mt-8"></div>

        {/* FIXED BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#eadecc] p-4 flex justify-end gap-4 z-40 shadow-inner">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-6 py-2.5 border border-gray-300 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={handleCompleteAndPrint}
            disabled={isSaving}
            className="px-8 py-2.5 bg-[#e2a83b] text-white font-bold text-xs rounded-xl hover:bg-[#c9922f] shadow-sm cursor-pointer"
          >
            {isSaving ? "Processing..." : "Complete & Print Prescription"}
          </button>
        </div>
      </div>
    
  );
}