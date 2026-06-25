// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { AppRole, ROLE_PERMISSIONS, ROLE_HOME_ROUTES } from "../lib/rbac";

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   allowedRoles: AppRole[];
// }

// export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [isAuthorized, setIsAuthorized] = useState(false);

//   useEffect(() => {
//     // 1. Grab the active session
//     const sessionStr = localStorage.getItem("idhn_session");
    
//     if (!sessionStr) {
//       router.push("/login");
//       return;
//     }

//     try {
//       const session = JSON.parse(sessionStr);
//       const userRole = session.role as AppRole;

//       // 2. Check if the user's role is allowed on this specific page
//       if (!allowedRoles.includes(userRole)) {
//         alert(`Access Denied: Your role (${userRole}) does not have clearance for this module.`);
//         // Bounce them to their assigned home page
//         router.push(ROLE_HOME_ROUTES[userRole] || "/login");
//         return;
//       }

//       // 3. User is verified, render the page
//       setIsAuthorized(true);
//     } catch (error) {
//       router.push("/login");
//     }
//   }, [pathname, allowedRoles, router]);

//   if (!isAuthorized) {
//     return (
//       <div className="min-h-screen bg-[#fcfaf4] flex items-center justify-center text-[#0f6266] font-bold animate-pulse">
//         Verifying Security Clearance...
//       </div>
//     );
//   }

//   return <>{children}</>;
// }