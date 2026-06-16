"use client";

import React, { useEffect, useState } from "react";
import {
  fetchPatients,
  registerPatient,
  PatientRecord,
  DoctorSelectOption,
  fetchAvailableDoctors,
} from "@/app/actions";
import PatientProfileWorkspace from "../PatientProfileWorkspace";

export default function PatientsPanel() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [availableDoctors, setAvailableDoctors] = useState<
    DoctorSelectOption[]
  >([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(
    null,
  );
  // Inside your PatientsPanel component body:

  // Sync routine to pick up patient card blocks matching searches
  const loadData = async (query?: string) => {
    const res = await fetchPatients(query);
    if (res.success) {
      setPatients(res.data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    loadData(e.target.value);
  };

  // Inside components/PatientsPanel.tsx

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFormMsg(null);

    // 1. PATCH: Capture the raw HTML Form reference explicitly before any async await breaks the thread
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    try {
      // 2. Dispatch the payload natively to your MongoDB Cluster0 driver string
      const res = await registerPatient(formData);

      setLoading(false);

      if (res.success) {
        setFormMsg("🎉 Profile recorded natively.");

        // 3. PATCH: Call reset on the explicit captured reference
        formElement.reset();

        // 4. Refresh your background patient list view instantly
        loadData();

        // Gracefully clear alerts and collapse the modal window view
        setTimeout(() => {
          setIsModalOpen(false);
          setFormMsg(null);
        }, 1500);
      } else {
        setFormMsg(`❌ ${res.message}`);
      }
    } catch (error) {
      setLoading(false);
      setFormMsg("❌ Network execution error occurred.");
      console.error(error);
    }
  };

  // Extract initials cleanly for profile icon circles
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  useEffect(() => {
    loadData();

    // Fetch your live doctors roster from Mongo
    fetchAvailableDoctors().then((res) => {
      if (res.success) {
        setAvailableDoctors(res.data);
      }
    });
  }, []);
  if (selectedPatient) {
    return (
      <PatientProfileWorkspace
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }
  return (
    <div className="p-8 bg-[#fcfaf4] min-h-screen relative font-sans text-slate-800">
      {/* Top Banner Action Row */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0e1e38] font-serif">
          Patients
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#e2a83b] hover:bg-[#c9922f] text-white font-bold text-sm px-5 py-3 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          + Register New Patient
        </button>
      </div>

      {/* Live Filtering Search Input Box Container */}
      <div className="relative mb-8">
        <span className="absolute left-4 top-3.5 text-gray-400 text-lg">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name, ADHAR ID, phone, MRN..."
          className="w-full bg-white border border-[#eadecc] rounded-xl pl-12 pr-4 py-3 text-sm shadow-sm focus:outline-none focus:border-teal-600 transition-colors"
        />
      </div>

      {/* Grid Display Rendering Patient Context Profiling Cards */}
      {patients.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm font-medium">
          No system patient entries found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {patients.map((patient, index) => (
            <div
              key={patient._id || index}
              className="bg-white rounded-2xl border border-[#eadecc] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Header Subgrouping */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#d8f3f5] text-[#006677] flex items-center justify-center font-bold text-sm">
                    {getInitials(patient.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0e1e38] text-base leading-tight">
                      {patient.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {patient.age}
                      {patient.gender[0].toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Tracking Metrics Sub-Labels */}
                <div className="space-y-2 border-t border-dashed border-[#edf2f7] pt-3 text-xs font-medium text-gray-500">
                  <p>
                    MRN:{" "}
                    <span className="text-gray-700 font-mono select-all">
                      {patient.mrn}
                    </span>
                  </p>

                  <div>
                    {patient.abhaLinked ? (
                      <span className="inline-block bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-md px-2 py-0.5 font-bold text-[10px]">
                        ADHAR Linked ✓
                      </span>
                    ) : (
                      <span className="inline-block bg-amber-50 text-amber-600 border border-amber-200/60 rounded-md px-2 py-0.5 font-bold text-[10px]">
                        Link ADHAR
                      </span>
                    )}
                  </div>

                  <p className="pt-1">
                    Last visit:{" "}
                    <span className="text-gray-700">{patient.lastVisit}</span>
                  </p>
                  <p> {patient.assignedDoctor}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatient(patient)}
                className="w-full mt-5 border border-[#0f6266] text-[#0f6266] font-bold text-xs py-2.5 rounded-xl hover:bg-[#0f6266]/5 transition-colors cursor-pointer"
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Registration Form Modal Pop-up Box */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[2000]">
          <div className="bg-white rounded-2xl p-8 border border-[#eadecc] w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-[#0e1e38] font-serif mb-1">
              Intake Registry
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Initialize a new universal medical history profile record.
            </p>

            {formMsg && (
              <div className="p-3 mb-4 text-xs rounded-xl font-semibold border bg-slate-50 text-slate-700 text-center">
                {formMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Patient Legal Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Ramesh Kumar"
                    className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    required
                    placeholder="45"
                    className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-600 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Mobile Contact No
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  ADHAR ID / Number (Optional)
                </label>
                <input
                  type="text"
                  name="abhaId"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Attending Consultant Practitioner *
                </label>
                <select
                  name="assignedDoctor"
                  required
                  defaultValue=""
                  className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-600 cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select Attending Doctor --
                  </option>
                  {availableDoctors.length === 0 ? (
                    <option disabled>
                      No practitioners found in cluster database
                    </option>
                  ) : (
                    availableDoctors.map((doc) => (
                      <option key={doc.id} value={doc.name}>
                        {doc.name} ({doc.expertise})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#0f6266] hover:bg-[#0b4a4d] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:bg-slate-400"
                >
                  {loading ? "Saving to Core..." : "Initialize Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
