'use client';

import React, { useEffect, useState } from 'react';

import ClinicalDashboardView from './Components/ClinicalDashboardView';
import PublicLandingView from './Components/PublicLandingView';

interface UserSession {
  name: string;
  initials: string;
  role: string;
}

export default function RootPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
  try {
    const storedSession = localStorage.getItem('idhn_session');
    
    // Check if the string exists and isn't undefined before parsing
    if (storedSession && storedSession !== "undefined") {
      setSession(JSON.parse(storedSession));
    }
  } catch (error) {
    console.error("Failed to safely read local device session tokens:", error);
    // Clear corrupt storage tokens so the system doesn't freeze permanently
    localStorage.removeItem('idhn_session'); 
  } finally {
    // PATCH: This MUST run no matter what, otherwise you stay stuck on the loading text!
    setMounted(true); 
  }
}, []);

  // Prevent background flashing while Next.js matches storage states
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-gray-500 text-sm">
        Initializing IDHN Workspace Core...
      </div>
    );
  }

  // CONDITIONAL VIEW SWITCHING ENGINE
  return session ? (
    /* If logged in, mount the complete clinical workspace */
    <ClinicalDashboardView user={session} />
  ) : (
    /* If unauthenticated guest, render the standard landing details */
    <PublicLandingView />
  );
}