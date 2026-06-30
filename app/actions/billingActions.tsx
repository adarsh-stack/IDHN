"use server";

import { connectToDatabase } from "../lib/db";
import { ObjectId } from "mongodb";

export interface HospitalBill {
  _id: string;
  patientId: string;
  billeeName: string;
  department: "Pharmacy" | "Appointment";
  amount: number;
  status: "paid" | "unpaid";
  paymentMethod?: string;
  doctorName?: string;
  triageStatus?: string;
  checkupStatus?: string;
  items: Array<{ description: string; qty: number; total: number }>;
  createdAt: string;
}
export async function fetchCentralBills(
  department: "Pharmacy" | "Appointment",
): Promise<{ success: boolean; data: HospitalBill[] }> {
  try {
    const { db } = await connectToDatabase();
    const sortPattern = { createdAt: -1 };
    const bills = await db
      .collection("bills")
      .find({ department })
      .sort(sortPattern)
      .toArray();

    return {
      success: true,
      data: bills.map((b) => ({
        ...b,
        _id: b._id.toString(),
        createdAt: b.createdAt
          ? new Date(b.createdAt).toLocaleString("en-GB")
          : new Date().toLocaleString("en-GB"),
      })) as any,
    };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function searchPatientsForBilling(
  query: string,
): Promise<{ success: boolean; data: any[] }> {
  try {
    if (!query || query.trim().length < 2) return { success: true, data: [] };
    const { db } = await connectToDatabase();
    const searchFilter = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
        { abhaId: { $regex: query, $options: "i" } },
      ],
    };
    const patients = await db
      .collection("patients")
      .find(searchFilter)
      .limit(5)
      .toArray();
    return {
      success: true,
      data: patients.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        phone: p.phone,
        mrn: p.mrn,
        abhaId: p.abhaId,
      })),
    };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function createAppointmentBill(payload: {
  patientId: string;
  billeeName: string;
  doctorName: string;
  amount: number;
  paymentStatus: "paid" | "unpaid";
  paymentMethod: string;
  triageStatus: "Emergency" | "Normal" | "Review";
}): Promise<{ success: boolean; message: string; billId?: string }> {
  try {
    const { db } = await connectToDatabase();
    const newInvoice = {
      patientId: payload.patientId,
      billeeName: payload.billeeName,
      department: "Appointment",
      amount: payload.amount,
      status: payload.paymentStatus,
      paymentMethod:
        payload.paymentStatus === "paid" ? payload.paymentMethod : "",
      doctorName: payload.doctorName,
      triageStatus: payload.triageStatus,
      checkupStatus: "waiting",
      items: [
        {
          description: `Consultation Fee - Dr. ${payload.doctorName} (${payload.triageStatus})`,
          qty: 1,
          total: payload.amount,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection("bills").insertOne(newInvoice);
    return {
      success: true,
      message: "Appointment registered successfully.",
      billId: result.insertedId.toString(),
    };
  } catch (error) {
    return { success: false, message: "Accounting cluster write crash." };
  }
}

export async function settleUnpaidBill(
  billId: string,
  paymentMethod: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    await db
      .collection("bills")
      .updateOne(
        { _id: new ObjectId(billId) },
        { $set: { status: "paid", paymentMethod, updatedAt: new Date() } },
      );
    return {
      success: true,
      message: "Invoice cleared and settled successfully.",
    };
  } catch (error) {
    return { success: false, message: "Database transaction failed." };
  }
}
