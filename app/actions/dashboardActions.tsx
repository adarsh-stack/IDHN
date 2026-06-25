'use server';

import { connectToDatabase } from '../lib/db';

export interface DashboardMetrics {
  todaysOpd: number;
  opdWaiting: number;    // NEW
  opdCompleted: number;  // NEW
  opdTrend: number;
  ipdOccupied: number;
  ipdTotal: number;
  revenueToday: number;
  revenueTrend: number;
  pendingBillsCount: number;
  pendingBillsAmount: number;
}

/**
 * FETCH REAL-TIME AGGREGATE VALUES FOR DASHBOARD CARDS
 * Pulls directly from the unified billing and admissions ledgers for live accuracy.
 */
export async function fetchDashboardMetrics(): Promise<{ success: boolean; data: DashboardMetrics | null }> {
  try {
    const { db } = await connectToDatabase();
    
    // Setup start of today's time boundary for accurate daily aggregations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Fetch Today's OPD Count (Total generated appointments today)
    const todaysOpd = await db.collection('bills').countDocuments({
      department: 'Appointment',
      createdAt: { $gte: todayStart }
    });

    // 2. Fetch Completed OPD Count (Patients marked as 'completed' today)
    const opdCompleted = await db.collection('bills').countDocuments({
      department: 'Appointment',
      checkupStatus: 'completed',
      createdAt: { $gte: todayStart }
    });

    // 3. Calculate Waiting Queue
    const opdWaiting = todaysOpd - opdCompleted;

    // 4. Fetch IPD Occupancy (Active live admissions)
    const ipdOccupied = await db.collection('admissions').countDocuments({
      status: 'admitted'
    });
    const ipdTotal = 10; // System configured maximum bed capacity

    // 5. Compute Today's Revenue Aggregates (Sum of all paid bills today)
    const revenueResult = await db.collection('bills').aggregate([
      { $match: { status: 'paid', updatedAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    
    const revenueToday = revenueResult[0]?.total || 0;

    // 6. Compute Pending Overdues (All Unpaid Bills across the Hospital System)
    const pendingBills = await db.collection('bills').aggregate([
      { $match: { status: 'unpaid' } },
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]).toArray();

    const pendingBillsCount = pendingBills[0]?.count || 0;
    const pendingBillsAmount = pendingBills[0]?.totalAmount || 0;

    return {
      success: true,
      data: {
        todaysOpd: todaysOpd || 0,
        opdWaiting: opdWaiting || 0,
        opdCompleted: opdCompleted || 0,
        opdTrend: 0, // Ready for historical mapping logic
        ipdOccupied: ipdOccupied || 0,
        ipdTotal,
        revenueToday: revenueToday || 0,
        revenueTrend: 0, // Ready for historical mapping logic
        pendingBillsCount: pendingBillsCount || 0,
        pendingBillsAmount: pendingBillsAmount || 0
      }
    };
  } catch (error) {
    console.error('Failed to aggregate dashboard metrics:', error);
    return { success: false, data: null };
  }
}