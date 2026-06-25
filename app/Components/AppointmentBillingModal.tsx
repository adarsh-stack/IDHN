"use client";

import React, { useState, useEffect } from "react";
import {
  searchPatientsForBilling,
  fetchAvailableDoctors,
  createAppointmentBill,
  DoctorSelectOption,
} from "@/app/actions";

interface AppointmentBillModalProps {
  onClose: () => void;
  onSuccess: (billId: string, payload: any) => void;
}

export default function AppointmentBillModal({
  onClose,
  onSuccess,
}: AppointmentBillModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  const [doctors, setDoctors] = useState<DoctorSelectOption[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>("");
  const [baseFee, setBaseFee] = useState<number>(300); // Tracks the normal fee

  // New Triage State
  const [triageStatus, setTriageStatus] = useState<
    "Normal" | "Emergency" | "Review"
  >("Normal");

  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("paid");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [loading, setLoading] = useState(false);

  // Dynamic Fee Calculation: Doubles if Emergency is selected
  const consultingFee = triageStatus === "Emergency" ? baseFee * 2 : baseFee;

  useEffect(() => {
    async function loadDoctors() {
      const res = await fetchAvailableDoctors();
      if (res.success) setDoctors(res.data);
    }
    loadDoctors();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        const res = await searchPatientsForBilling(searchQuery);
        if (res.success) setPatientResults(res.data);
      } else {
        setPatientResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleDoctorChange = (docName: string) => {
    setSelectedDoc(docName);
    const docObj = doctors.find((d) => d.name === docName);
    if (docObj?.expertise.toLowerCase().includes("cardio")) setBaseFee(800);
    else if (docObj?.expertise.toLowerCase().includes("neuro"))
      setBaseFee(1000);
    else setBaseFee(300);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient)
      return alert("Please search and match a registered patient first.");
    if (!selectedDoc) return alert("Please assign a consultant specialist.");

    setLoading(true);
    const payload = {
      patientId: selectedPatient.mrn,
      billeeName: selectedPatient.name,
      doctorName: selectedDoc,
      amount: consultingFee,
      paymentStatus,
      paymentMethod,
      triageStatus, // Sent to backend
    };

    const res = await createAppointmentBill(payload);
    setLoading(false);
    if (res.success && res.billId) {
      onSuccess(res.billId, {
        ...payload,
        items: [
          {
            description: `Consultation Fee - Dr. ${payload.doctorName} (${triageStatus})`,
            qty: 1,
            total: payload.amount,
          },
        ],
      });
    } else {
      alert(res.message);
    }
  };

  const qrUrl = `upi://pay?pa=hospital@upi&pn=OPD%20Billing&am=${consultingFee}&cu=INR`;
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[3000] p-4">
      <div className="bg-white rounded-2xl p-6 border border-[#eadecc] w-full max-w-lg shadow-2xl relative text-slate-800 animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-[#0e1e38] font-serif mb-1">
          Generate Appointment Invoice
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Search patient registries and clear consulting triage accounts.
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Patient Search */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Lookup Patient (Name/Phone) *
            </label>
            {selectedPatient ? (
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    {selectedPatient.name}
                  </p>
                  <p className="text-[10px] text-emerald-600">
                    MRN: {selectedPatient.mrn} • Phone: {selectedPatient.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs font-bold text-red-500 underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Type parameters to filter active files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
                {patientResults.length > 0 && (
                  <div className="absolute left-0 right-0 bg-white border border-gray-200 mt-1 rounded-xl shadow-lg overflow-hidden z-[3100] divide-y divide-gray-50">
                    {patientResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientResults([]);
                          setSearchQuery("");
                        }}
                        className="p-2.5 text-xs hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <p className="font-bold text-[#0e1e38]">
                          {p.name}{" "}
                          <span className="text-[10px] text-gray-400 font-mono">
                            ({p.mrn})
                          </span>
                        </p>
                        <p className="text-[9px] text-gray-400">
                          Phone: {p.phone || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Row 1: Doctor & Triage Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Assign Consultant *
              </label>
              <select
                value={selectedDoc}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                required
              >
                <option value="">Select Practitioner</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.name}>
                    Dr. {d.name} ({d.expertise})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Triage Priority
              </label>
              <select
                value={triageStatus}
                onChange={(e) =>
                  setTriageStatus(
                    e.target.value as "Normal" | "Emergency" | "Review",
                  )
                }
                className={`w-full border rounded-lg px-2.5 py-2 text-xs font-bold focus:outline-none transition-colors ${
                  triageStatus === "Emergency"
                    ? "bg-red-50 border-red-200 text-red-600"
                    : triageStatus === "Review"
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "bg-emerald-50 border-emerald-200 text-emerald-600"
                }`}
              >
                <option value="Normal">● Normal (Standard Fee)</option>
                <option value="Review">● Review (Follow-up)</option>
                <option value="Emergency">🔴 Emergency (2x Fee)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Fees & Payment Status */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Consultation Fees (₹)
              </label>
              <input
                type="text"
                readOnly
                value={`₹ ${consultingFee}`}
                className="w-full bg-slate-50 border border-gray-200 font-mono font-bold rounded-lg px-3 py-2 text-xs text-slate-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as "paid" | "unpaid")
                }
                className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-2.5 py-2 text-xs font-bold"
              >
                <option value="paid">✓ Set as PAID</option>
                <option value="unpaid">⚠️ Set as UNPAID (Due)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Transaction Mode */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Mode of Transaction
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={paymentStatus === "unpaid"}
              className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-2.5 py-2 text-xs disabled:opacity-50"
            >
              <option value="UPI">UPI / Paytm QR</option>
              <option value="Cash">Cash Payments</option>
              <option value="Card">Credit/Debit Card</option>
            </select>
          </div>

          {/* Dynamic UPI Layout */}
          {paymentMethod === "UPI" &&
            paymentStatus === "paid" &&
            selectedPatient && (
              <div className="bg-[#fcfaf4] border border-dashed border-[#eadecc] p-3 rounded-xl flex items-center justify-between mt-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Paytm Device Link
                  </span>
                  <p className="text-xs font-bold text-slate-700 pt-1">
                    Dynamic Desk UPI Route
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Amount auto-mapped to counter token.
                  </p>
                </div>
                <img
                  src={qrImg}
                  alt="Dynamic Token QR"
                  className="w-20 h-20 object-contain bg-white p-1 border rounded-lg"
                />
              </div>
            )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#0f6266] text-white font-bold text-xs rounded-lg hover:bg-[#0b4a4d]"
            >
              {loading ? "Processing..." : "Generate Bill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
