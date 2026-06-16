'use server';

import { connectToDatabase } from '../lib/db';

export interface DashboardMetrics {
  todaysOpd: number;
  opdTrend: number;
  ipdOccupied: number;
  ipdTotal: number;
  revenueToday: number;
  revenueTrend: number;
  pendingBillsCount: number;
  pendingBillsAmount: number;
}

export async function fetchDashboardMetrics(): Promise<{ success: boolean; data: DashboardMetrics | null }> {
  try {
    const { db } = await connectToDatabase();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaysOpd = await db.collection('appointments').countDocuments({
      createdAt: { $gte: todayStart }
    });

    const ipdOccupied = await db.collection('admissions').countDocuments({
      status: 'admitted'
    });
    const ipdTotal = 10; 

    const revenueResult = await db.collection('bills').aggregate([
      { $match: { status: 'paid', updatedAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    const revenueToday = revenueResult[0]?.total || 0;

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
        opdTrend: 0,
        ipdOccupied: ipdOccupied || 0,
        ipdTotal,
        revenueToday: revenueToday || 0,
        revenueTrend: 0,
        pendingBillsCount: pendingBillsCount || 0,
        pendingBillsAmount: pendingBillsAmount || 0
      }
    };
  } catch (error) {
    console.error('Failed to aggregate dashboard metrics:', error);
    return { success: false, data: null };
  }
}