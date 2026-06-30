"use server";

import { connectToDatabase } from "../lib/db";
import { ObjectId } from "mongodb";

export interface MedicineItem {
  _id?: string;
  name: string;
  batchNumber: string;
  stockCount: number;
  pricePerUnit: number;
  tabletsPerPack: number;
  expiryDate: string;
}

export async function fetchInventory(): Promise<{
  success: boolean;
  data: MedicineItem[];
}> {
  try {
    const { db } = await connectToDatabase();
    const items = await db
      .collection("pharmacy_inventory")
      .find({})
      .sort({ name: 1 })
      .toArray();

    return {
      success: true,
      data: items.map((i) => ({
        ...i,
        _id: i._id.toString(),
      })) as unknown as MedicineItem[],
    };
  } catch (error) {
    console.error("Failed to load pharmacy stock:", error);
    return { success: false, data: [] };
  }
}

export async function addNewMedicine(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();

    const name = formData.get("name") as string;
    const batchNumber = formData.get("batchNumber") as string;
    const tabletsPerPack =
      parseInt(formData.get("tabletsPerPack") as string) || 0;
    const stockCount = parseInt(formData.get("stockCount") as string) || 0;
    const pricePerUnit =
      parseFloat(formData.get("pricePerUnit") as string) || 0;
    const expiryDate = formData.get("expiryDate") as string;

    await db.collection("pharmacy_inventory").insertOne({
      name,
      batchNumber,
      stockCount,
      pricePerUnit,
      tabletsPerPack,
      expiryDate,
      createdAt: new Date(),
    });

    return {
      success: true,
      message: "Medicine loaded to local node inventory.",
    };
  } catch (error) {
    console.error("Failed to create stock record:", error);
    return { success: false, message: "Database transaction error." };
  }
}

export async function adjustStockCount(
  medicineId: string,
  newQuantity: number,
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    await db
      .collection("pharmacy_inventory")
      .updateOne(
        { _id: new ObjectId(medicineId) },
        { $set: { stockCount: Number(newQuantity) } },
      );
    return {
      success: true,
      message: "Stock adjustments updated successfully.",
    };
  } catch (error) {
    console.error("Stock modifier crashed:", error);
    return { success: false, message: "Failed to modify inventory logs." };
  }
}

export async function executeDispensation(payload: {
  patientId: string;
  billeeName: string;
  billeePhone: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    totalPrice: number;
  }>;
  grandTotal: number;
  paymentStatus: "paid" | "unpaid";
  paymentMethod: string;
}): Promise<{ success: boolean; message: string; billId?: string }> {
  try {
    const { db } = await connectToDatabase();

    for (const item of payload.items) {
      await db
        .collection("pharmacy_inventory")
        .updateOne(
          { _id: new ObjectId(item.id) },
          { $inc: { stockCount: -Math.abs(item.quantity) } },
        );
    }

    const billResult = await db.collection("bills").insertOne({
      patientId: payload.patientId || "WALK-IN",
      billeeName: payload.billeeName,
      billeePhone: payload.billeePhone,
      department: "Pharmacy",
      amount: payload.grandTotal,
      status: payload.paymentStatus,
      paymentMethod: payload.paymentMethod,
      items: payload.items.map((i) => ({
        description: i.name,
        qty: i.quantity,
        total: i.totalPrice,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const generatedBillId = billResult.insertedId.toString();

    await db.collection("audit_logs").insertOne({
      action: "PHARMACY_DISPENSATION_BILLED",
      billId: generatedBillId,
      amount: payload.grandTotal,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: `Dispensation processed. Invoice #${generatedBillId.substring(18)} generated.`,
      billId: generatedBillId,
    };
  } catch (error) {
    console.error("Dispensation pipeline failed:", error);
    return { success: false, message: "Transactional dispatch failure." };
  }
}

export async function deleteMedicine(
  medicineId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();

    const result = await db.collection("pharmacy_inventory").deleteOne({
      _id: new ObjectId(medicineId),
    });

    return result.deletedCount > 0
      ? {
          success: true,
          message: "Therapeutic item successfully purged from inventory.",
        }
      : { success: false, message: "Target batch profile index missing." };
  } catch (error) {
    console.error("Delete transaction failed:", error);
    return { success: false, message: "Database deletion request rejected." };
  }
}
