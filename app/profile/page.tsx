"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchUserProfile,
  updateUserProfile,
  fetchAllStaff,
  updateStaffAllocation,
  requestPasswordChangeOTP,
  verifyAndChangePassword,
} from "@/app/actions/profileActions";

export default function ProfilePage() {
  const router = useRouter();
  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem("idhn_session");
    };

    window.addEventListener("beforeunload", handleUnload);

    // Cleanup the listener if the component unmounts normally
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);
  // -- STATES --
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  // NEW MFA STATES
  const [otpStep, setOtpStep] = useState(false);
  const [isSecuring, setIsSecuring] = useState(false);
  const [pendingPasswords, setPendingPasswords] = useState({
    old: "",
    new: "",
  });
  // Doctor's Staff Management States
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  // 1. HYDRATION: Load real user data from MongoDB
  useEffect(() => {
    async function loadProfileData() {
      const sessionStr = localStorage.getItem("idhn_session");
      if (!sessionStr) {
        setLoading(false);
        return;
      }

      try {
        const session = JSON.parse(sessionStr);

        // Fetch the active user's actual database profile
        const userRes = await fetchUserProfile(session._id);
        if (userRes.success && userRes.data) {
          setUser(userRes.data);
        }

        // If the user is a Doctor, fetch the central staff list
        if (session.role === "Doctor") {
          const staffRes = await fetchAllStaff();
          if (staffRes.success) setStaffList(staffRes.data);
        }
      } catch (e) {
        console.error("Failed to load profile data");
      }
      setLoading(false);
    }

    loadProfileData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#fcfaf4] flex items-center justify-center text-[#0f6266] font-bold">
        Loading Central Database...
      </div>
    );
  if (!user)
    return (
      <div className="min-h-screen bg-[#fcfaf4] flex items-center justify-center text-red-500 font-bold">
        No active session found. Please log in.
      </div>
    );

  // --- HANDLERS ---

  // 2. SAVE PERSONAL PROFILE TO DATABASE
  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: any = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    const res = await updateUserProfile(user._id, payload);

    if (res.success) {
      setUser({ ...user, ...payload }); // Update local UI
      setIsEditModalOpen(false);
      alert("Profile details updated securely in the database.");
    } else {
      alert("Failed to update database.");
    }
  };

  // --- HIGH-SECURITY PASSWORD HANDLERS ---
  const handleRequestPasswordMFA = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setIsSecuring(true);

    const formData = new FormData(e.currentTarget);
    const oldPass = formData.get("oldPass") as string;
    const newPass = formData.get("newPass") as string;
    const confirmPass = formData.get("confirmPass") as string;

    if (newPass !== confirmPass) {
      alert("New passwords do not match.");
      setIsSecuring(false);
      return;
    }

    const res = await requestPasswordChangeOTP(user._id, oldPass, newPass);

    if (res.success) {
      setPendingPasswords({ old: oldPass, new: newPass });
      setOtpStep(true); // Flip UI to OTP screen
    } else {
      alert(res.message);
    }
    setIsSecuring(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSecuring(true);

    const formData = new FormData(e.currentTarget);
    const otp = formData.get("otp") as string;

    const res = await verifyAndChangePassword(
      user._id,
      otp,
      pendingPasswords.new,
    );

    if (res.success) {
      alert("✅ High-Security Password Update Complete!");
      setIsPasswordModalOpen(false);
      setOtpStep(false);
      setPendingPasswords({ old: "", new: "" });
    } else {
      alert(res.message);
    }
    setIsSecuring(false);
  };

  // 3. DOCTOR: SAVE STAFF ALLOCATIONS TO DATABASE
  const handleStaffUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLocation = formData.get("location") as string;
    const newShift = formData.get("shift") as string;

    const res = await updateStaffAllocation(
      selectedStaff._id,
      newLocation,
      newShift,
    );

    if (res.success) {
      // Refresh local staff list to show new data immediately
      setStaffList(
        staffList.map((staff) =>
          staff._id === selectedStaff._id
            ? { ...staff, location: newLocation, shift: newShift }
            : staff,
        ),
      );
      setSelectedStaff(null);
      alert("Staff allocation successfully updated in the central server.");
    } else {
      alert("Failed to update staff allocation.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf4] p-4 sm:p-8 text-slate-800 font-sans pb-24 relative">
      <div className="max-w-6xl mx-auto">
        {/* TOP CONTROLS */}
        <div className="flex justify-between items-center mb-8 border-b border-[#eadecc] pb-4">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-xs font-bold text-[#0f6266] hover:underline cursor-pointer flex items-center gap-1 mb-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold font-serif text-[#0e1e38]">
              Profile Settings
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm cursor-pointer"
            >
              Change Password
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-[#0f6266] text-white rounded-lg text-xs font-bold hover:bg-[#0b4a4d] shadow-sm cursor-pointer"
            >
              Edit Personal Details
            </button>
          </div>
        </div>

        {/* PROFILE HEADER CARD */}
        <div className="bg-white border border-[#eadecc] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 mb-8 relative overflow-hidden">
          <div className="w-24 h-24 bg-[#eaf8f9] rounded-full border-4 border-[#0f6266]/10 flex items-center justify-center text-3xl font-bold text-[#0f6266] shrink-0 uppercase">
            {user.name ? user.name.substring(0, 2) : "US"}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-[#0e1e38]">{user.name}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
              <span className="bg-[#eaf8f9] text-[#0f6266] text-[10px] font-bold px-3 py-1 rounded-md tracking-widest uppercase border border-[#d8f3f5]">
                {user.role}
              </span>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-md border">
                ✉️ {user.email || "user@hospital.com"}
              </span>
            </div>
          </div>
        </div>

        {/* DYNAMIC DISPLAY GRID */}
        <div className="bg-white border border-[#eadecc] rounded-2xl p-6 shadow-sm mb-8">
          <h3 className="text-sm font-bold text-[#0e1e38] font-serif mb-4 border-b border-gray-100 pb-2">
            Professional & Contact Demographics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoTile label="Contact Number" value={user.phone} icon="📞" />
            <InfoTile
              label="Alternate Number"
              value={user.altPhone}
              icon="📱"
            />
            <InfoTile
              label="Residential Address"
              value={user.address}
              icon="🏠"
            />
            <InfoTile label="Highest Degree" value={user.degree} icon="🎓" />
            <InfoTile
              label="College / University"
              value={user.college}
              icon="🏛️"
            />

            {/* Role Specific Read-Only Fields */}
            {user.role === "Doctor" ? (
              <>
                <InfoTile
                  label="Speciality"
                  value={user.speciality}
                  icon="⚕️"
                />
                <InfoTile
                  label="Cabin Allocation"
                  value={user.cabinNo}
                  icon="🚪"
                />
                <InfoTile
                  label="Consultation Timings"
                  value={user.timing}
                  icon="⏱️"
                />
              </>
            ) : (
              <>
                <InfoTile
                  label="Assigned Location"
                  value={user.location}
                  icon="📍"
                  highlight
                />
                <InfoTile
                  label="Assigned Shift"
                  value={user.shift}
                  icon="⏱️"
                  highlight
                />
                <div className="col-span-full mt-2">
                  <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 inline-block font-bold">
                    ℹ️ Shift and Location allocations are strictly managed by
                    the Attending Doctors.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* DOCTOR ONLY: STAFF MANAGEMENT CONSOLE */}
        {user.role === "Doctor" && (
          <div className="bg-white border border-[#0f6266]/20 rounded-2xl p-6 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-[#0e1e38] font-serif mb-1">
              Staff Roster & Management
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Click on a staff member to view details or reassign their shifts
              and locations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList
                .filter((s) => s._id !== user._id)
                .map((staff) => (
                  <div
                    key={staff._id}
                    onClick={() => setSelectedStaff(staff)}
                    className="bg-[#fcfaf4] border border-[#eadecc] p-4 rounded-xl cursor-pointer hover:border-[#0f6266] hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#0f6266] bg-[#0f6266]/10 px-2 py-0.5 rounded">
                        {staff.role}
                      </span>
                    </div>
                    <h4 className="font-bold text-[#0e1e38]">{staff.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-1">
                      📍 {staff.location || "Unassigned"}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      ⏱ {staff.shift || "Unassigned"}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. EDIT PROFILE MODAL (DYNAMIC BASED ON ROLE) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[5000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-[#eadecc] flex justify-between items-center bg-[#fcfaf4]">
              <h2 className="text-xl font-bold text-[#0e1e38] font-serif">
                Update Personal Details
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleProfileUpdate}
              className="p-6 overflow-y-auto custom-scrollbar space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup
                  name="name"
                  label="Full Name"
                  defaultValue={user.name}
                />
                <InputGroup
                  name="phone"
                  label="Contact Number"
                  defaultValue={user.phone}
                />
                <InputGroup
                  name="altPhone"
                  label="Alternate Number"
                  defaultValue={user.altPhone}
                />
                <InputGroup
                  name="degree"
                  label="Degree / Qualification"
                  defaultValue={user.degree}
                />
                <InputGroup
                  name="college"
                  label="College / University"
                  defaultValue={user.college}
                />
                <div className="md:col-span-2">
                  <InputGroup
                    name="address"
                    label="Residential Address"
                    defaultValue={user.address}
                  />
                </div>

                {/* Doctor Specific Editable Fields */}
                {user.role === "Doctor" && (
                  <>
                    <InputGroup
                      name="speciality"
                      label="Medical Speciality"
                      defaultValue={user.speciality}
                    />
                    <InputGroup
                      name="cabinNo"
                      label="Cabin Allocation"
                      defaultValue={user.cabinNo}
                    />

                    {/* The new Visual Slide Clock Component spanning full width */}
                    <div className="md:col-span-2">
                      <TimeRangeSelector
                        name="timing"
                        label="Consultation Timings (24Hr Format)"
                        defaultValue={user.timing}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 border rounded-lg text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0f6266] text-white rounded-lg text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CHANGE PASSWORD MODAL (DUMMY) */}
      {/* 2. HIGH-SECURITY PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[5000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative p-6 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-[#0e1e38] font-serif mb-1">
              {otpStep ? "MFA Verification" : "Change Password"}
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              {otpStep
                ? "A 6-digit secure code has been sent to your registered terminal email."
                : "Protected by IDHN Multi-Factor Authentication."}
            </p>

            {!otpStep ? (
              <form onSubmit={handleRequestPasswordMFA} className="space-y-4">
                <InputGroup
                  name="oldPass"
                  label="Current Password"
                  type="password"
                  required
                />
                <InputGroup
                  name="newPass"
                  label="New Password (12+ Chars, Symbols, Numbers)"
                  type="password"
                  required
                />
                <InputGroup
                  name="confirmPass"
                  label="Confirm New Password"
                  type="password"
                  required
                />
                <div className="pt-4 flex justify-end gap-3 border-t mt-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSecuring}
                    className="px-4 py-2 bg-[#0f6266] hover:bg-[#0b4a4d] text-white rounded-lg text-xs font-bold"
                  >
                    {isSecuring
                      ? "Requesting OTP..."
                      : "Send Verification Code"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#0f6266] uppercase mb-1.5 text-center">
                    Enter 6-Digit Code
                  </label>
                  <input
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    className="w-full bg-[#eaf8f9] border border-[#d8f3f5] rounded-xl px-4 py-3 text-2xl tracking-[0.5em] text-center font-mono font-bold text-[#0f6266] focus:outline-none focus:border-[#0f6266]"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t mt-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-600"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSecuring}
                    className="px-4 py-2 bg-[#e2a83b] hover:bg-[#c9922f] text-white rounded-lg text-xs font-bold"
                  >
                    {isSecuring ? "Verifying..." : "Verify & Save Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. DOCTOR'S STAFF MANAGEMENT MODAL */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[5000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-[#eadecc] bg-[#fcfaf4]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">
                    {selectedStaff.role}
                  </span>
                  <h2 className="text-xl font-bold text-[#0e1e38] font-serif mt-1">
                    {selectedStaff.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Phone:</strong> {selectedStaff.phone || "N/A"}
                </p>
                <p>
                  <strong>Degree:</strong> {selectedStaff.degree || "N/A"} (
                  {selectedStaff.college || "N/A"})
                </p>
              </div>

              {/* Only allow editing if the staff is NOT a Doctor */}
              {selectedStaff.role === "Doctor" ? (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
                  <p>
                    <strong>Assigned Cabin:</strong>{" "}
                    {selectedStaff.cabinNo || selectedStaff.location || "N/A"}
                  </p>
                  <p>
                    <strong>Shift Timings:</strong>{" "}
                    {selectedStaff.timing || selectedStaff.shift || "N/A"}
                  </p>
                  <p className="mt-2 font-bold opacity-70">
                    ℹ️ You cannot modify another physician's schedule.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleStaffUpdate}
                  className="space-y-4 border-t pt-4"
                >
                  <h4 className="text-xs font-bold text-[#0e1e38] uppercase">
                    Modify Allocations
                  </h4>
                  <InputGroup
                    name="location"
                    label="Location Allocation"
                    defaultValue={selectedStaff.location}
                  />

                  {/* Replaced standard input with the Visual Time Selector */}
                  <TimeRangeSelector
                    name="shift"
                    label="Shift Timings (24Hr Format)"
                    defaultValue={selectedStaff.shift}
                  />

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#0f6266] text-white rounded-lg text-xs font-bold w-full"
                    >
                      Apply New Schedule
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- HELPER UI COMPONENTS ---

function InfoTile({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${highlight ? "bg-[#eaf8f9] border-[#d8f3f5]" : "bg-[#fcfaf4] border-[#eadecc]/60"}`}
    >
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <span>{icon}</span> {label}
      </p>
      <p
        className={`text-sm font-bold ${highlight ? "text-[#0f6266]" : "text-[#0e1e38]"}`}
      >
        {value || (
          <span className="text-gray-400 italic font-normal">Not Provided</span>
        )}
      </p>
    </div>
  );
}

function InputGroup({
  name,
  label,
  defaultValue = "",
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[#0f6266] transition-colors"
      />
    </div>
  );
}

function TimeRangeSelector({
  name,
  label,
  defaultValue = "09:00-17:00",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  // Parse the existing "09:00 - 17:00" string into start and end states
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  // Attempt to safely split the incoming database string on mount
  React.useEffect(() => {
    if (defaultValue) {
      // Handles both "09:00-17:00" and "09:00 - 17:00" formats
      const parts = defaultValue.replace(/\s+/g, "").split("-");
      if (parts.length === 2) {
        setStart(parts[0]);
        setEnd(parts[1]);
      }
    }
  }, [defaultValue]);

  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[#0f6266] transition-colors cursor-pointer"
          />
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          To
        </span>
        <div className="relative flex-1">
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[#0f6266] transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* This hidden input stitches the times back together when the form submits.
        This means your backend doesn't need to change at all! 
      */}
      <input type="hidden" name={name} value={`${start} - ${end}`} />
    </div>
  );
}
