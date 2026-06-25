

export type AppRole = 'Doctor' | 'Pharmacy' | 'Receptionist';

// Define exactly which base routes each role is allowed to access
// export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
//   Doctor: ['/', '/patient', '/billing'],
//   Pharmacy: ['/', '/billing'],
//   Receptionist: ['/', '/billing', '/queue'],
// };

// // Define where each role should be redirected immediately after logging in
// export const ROLE_HOME_ROUTES: Record<AppRole, string> = {
//   Doctor: '/',
//   Pharmacy: '/',
//   Receptionist: '/', // or '/queue' depending on your main reception page
// };