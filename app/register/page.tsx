'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { handleRegister } from '../actions';

export default function RegisterPage() {
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await handleRegister(formData);

    setLoading(false);

    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
      // Redirect to your login screen after a brief delay so they see the success banner
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#121212]">
      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-10 rounded-2xl border border-[#333] w-full max-w-md shadow-2xl">
        <h2 className="text-white text-2xl font-bold text-center mb-1">Join IDHN Ecosystem</h2>
        <p className="text-gray-400 text-xs text-center mb-6">Staff & Practitioner Onboarding Portal</p>
        
        {statusMessage && (
          <div className={`p-3 rounded-lg text-xs mb-4 text-center border ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30' 
              : 'bg-rose-950/30 text-rose-400 border-rose-500/30'
          }`}>
            {statusMessage.text}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-300 text-xs font-medium mb-1.5">Full Professional Name</label>
          <input type="text" name="name" required placeholder="Dr. Sharma" className="w-full px-4 py-2.5 rounded-lg border border-[#444] bg-[#262626] text-white text-sm" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 text-xs font-medium mb-1.5">Official Hospital Email</label>
          <input type="email" name="email" required placeholder="sharma@idhn.local" className="w-full px-4 py-2.5 rounded-lg border border-[#444] bg-[#262626] text-white text-sm" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 text-xs font-medium mb-1.5">System Access Role</label>
          <select name="role" className="w-full px-4 py-2.5 rounded-lg border border-[#444] bg-[#262626] text-white text-sm cursor-pointer">
            <option value="Doctor">Doctor / Practitioner</option>
            <option value="Nurse">Nursing Staff</option>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Lab Technician">Lab Technician</option>
            <option value="Admin">Hospital Administrator</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 text-xs font-medium mb-1.5">Access Password</label>
          <input type="password" name="password" required placeholder="••••••••" className="w-full px-4 py-2.5 rounded-lg border border-[#444] bg-[#262626] text-white text-sm" />
        </div>

        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition-colors cursor-pointer disabled:bg-teal-800">
          {loading ? 'Creating System Account...' : 'Register New Member'}
        </button>

        <p className="text-gray-400 text-xs text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-400 hover:underline">
            Log In Here
          </Link>
        </p>
      </form>
    </div>
  );
}