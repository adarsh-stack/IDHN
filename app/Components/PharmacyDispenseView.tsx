"use client";

import React, { useState } from "react";
import { MedicineItem, executeDispensation } from "@/app/actions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

interface BasketItem extends MedicineItem {
  dispenseQty: number;
}

interface PharmacyDispenseViewProps {
  inventory: MedicineItem[];
  onRefresh: () => void;
}

export default function PharmacyDispenseView({
  inventory,
  onRefresh,
}: PharmacyDispenseViewProps) {
  const [basket, setBasket] = useState<BasketItem[]>([]);

  // POS & Billing States
  const [billToPatient, setBillToPatient] = useState<boolean>(true);
  const [patientId, setPatientId] = useState<string>("");
  const [billeeName, setBilleeName] = useState<string>("");
  const [billeePhone, setBilleePhone] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">(
    "unpaid",
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // PATCH 2: Success Modal State
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  const addToBasket = (item: MedicineItem) => {
    if (item.stockCount <= 0)
      return alert("Cannot dispense out-of-stock items.");
    const existing = basket.find((b) => b._id === item._id);
    if (existing) {
      if (existing.dispenseQty >= item.stockCount)
        return alert("Maximum available stock exceeded.");
      setBasket(
        basket.map((b) =>
          b._id === item._id ? { ...b, dispenseQty: b.dispenseQty + 1 } : b,
        ),
      );
    } else {
      setBasket([...basket, { ...item, dispenseQty: 1 }]);
    }
  };

  const updateBasketQty = (id: string, qty: number, maxStock: number) => {
    if (qty > maxStock) return alert("Insufficient stock values available.");
    if (qty <= 0) {
      setBasket(basket.filter((b) => b._id !== id));
    } else {
      setBasket(
        basket.map((b) => (b._id === id ? { ...b, dispenseQty: qty } : b)),
      );
    }
  };

  const grandTotal = basket.reduce(
    (acc, b) => acc + b.dispenseQty * b.pricePerUnit,
    0,
  );

  // PATCH 3: Updated PDF Generator Syntax
  const generatePDFInvoice = (billId: string) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("HOSPITAL PHARMACY INVOICE", 14, 22);
    doc.setFontSize(10);
    doc.text(`Invoice ID: #${billId.substring(18).toUpperCase()}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 35);

    // Billee Info
    doc.text(
      `Billed To: ${billToPatient ? `Patient ID: ${patientId}` : billeeName}`,
      14,
      45,
    );
    if (!billToPatient) doc.text(`Phone: ${billeePhone}`, 14, 50);
    doc.text(
      `Payment Status: ${paymentStatus.toUpperCase()} (${paymentMethod})`,
      14,
      55,
    );

    // Table
    const tableColumn = [
      "Medicine / Item",
      "Batch",
      "Qty",
      "Unit Rate",
      "Total",
    ];
    const tableRows = basket.map((item) => [
      item.name,
      item.batchNumber,
      item.dispenseQty.toString(),
      `Rs. ${item.pricePerUnit.toFixed(2)}`,
      `Rs. ${(item.dispenseQty * item.pricePerUnit).toFixed(2)}`,
    ]);

    // Use autoTable explicitly by passing the doc instance
    autoTable(doc, {
      startY: 65,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [15, 98, 102] },
    });

    // Footer Total
    const finalY = (doc as any).lastAutoTable?.finalY || 65;
    doc.setFontSize(14);
    doc.text(`Grand Total: Rs. ${grandTotal.toFixed(2)}`, 14, finalY + 10);

    // Save
    doc.save(`Invoice_Pharmacy_${billId.substring(18)}.pdf`);
  };

  const handleCheckoutDispense = async () => {
    if (basket.length === 0)
      return alert("Your dispensing basket is completely empty.");
    if (billToPatient && !patientId)
      return alert(
        "Please enter a valid Patient ID or switch to manual billee.",
      );
    if (!billToPatient && !billeeName)
      return alert("Please provide the external person's name for the bill.");

    setIsProcessing(true);

    const checkoutItems = basket.map((b) => ({
      id: b._id!,
      name: b.name,
      quantity: b.dispenseQty,
      totalPrice: b.dispenseQty * b.pricePerUnit,
    }));

    const payload = {
      patientId: billToPatient ? patientId : "",
      billeeName: billToPatient ? "Patient" : billeeName,
      billeePhone: billToPatient ? "" : billeePhone,
      items: checkoutItems,
      grandTotal,
      paymentStatus,
      paymentMethod,
    };

    const res = await executeDispensation(payload);
    setIsProcessing(false);

    if (res.success && res.billId) {
      // 1. Generate the PDF
      generatePDFInvoice(res.billId);

      // 2. Trigger the Success Modal instead of an alert
      setSuccessModal({ show: true, message: res.message });

      // 3. Clear the Basket and Form cleanly
      setBasket([]);
      setPatientId("");
      setBilleeName("");
      setBilleePhone("");
      onRefresh();
    } else {
      alert(res.message);
    }
  };

  const upiUrl = `upi://pay?pa=hospitalmerchant@upi&pn=Hospital%20Pharmacy&am=${grandTotal.toFixed(2)}&cu=INR`;
  const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative">
      {/* --- SUCCESS MODAL OVERLAY --- */}
      {successModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[3000]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200 border border-[#eadecc]">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
              ✓
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-[#0e1e38]">
                Transaction Complete
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {successModal.message}
              </p>
            </div>
            <button
              onClick={() => setSuccessModal({ show: false, message: "" })}
              className="w-full bg-[#0f6266] hover:bg-[#0b4a4d] text-white py-3 rounded-xl font-bold text-xs mt-4 transition-colors cursor-pointer shadow-md"
            >
              Continue Dispensing
            </button>
          </div>
        </div>
      )}

      {/* Left Hand: Selection Grid Catalog */}
      <div className="lg:col-span-3 bg-white border border-[#eadecc] rounded-2xl shadow-sm p-5 space-y-3 h-fit">
        <h3 className="text-sm font-bold font-serif text-[#0e1e38] mb-2">
          Available Therapeutics Catalog
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inventory.map((item) => (
            <div
              key={item._id}
              className="p-4 bg-[#fcfaf4] border border-[#eadecc]/60 rounded-xl flex justify-between items-center shadow-sm"
            >
              <div>
                <h4 className="font-bold text-xs text-[#0e1e38]">
                  {item.name}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">
                  Stock: {item.stockCount} units • Rate: ₹
                  {item.pricePerUnit.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => addToBasket(item)}
                disabled={item.stockCount <= 0}
                className="bg-[#0f6266] text-white font-bold text-[11px] px-3 py-1.5 rounded-lg disabled:bg-slate-300 transition-colors cursor-pointer shadow-sm"
              >
                + Dispense
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right Hand Sidebar: POS System */}
      <div className="lg:col-span-2 bg-white border border-[#eadecc] rounded-2xl p-6 shadow-sm flex flex-col justify-between h-fit space-y-6">
        <div>
          <h3 className="text-sm font-bold font-serif text-[#0e1e38] border-b border-gray-150 pb-2.5 mb-4">
            Dispensing Summary Basket
          </h3>
          {basket.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">
              No medications staged for verification.
            </p>
          ) : (
            <div className="space-y-3 divide-y divide-gray-100/60 max-h-48 overflow-y-auto pr-1">
              {basket.map((b) => (
                <div
                  key={b._id}
                  className="flex justify-between items-center pt-2.5 first:pt-0 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#0e1e38]">{b.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      ₹{(b.pricePerUnit * b.dispenseQty).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={b.dispenseQty}
                      onChange={(e) =>
                        updateBasketQty(
                          b._id!,
                          Number(e.target.value),
                          b.stockCount,
                        )
                      }
                      className="w-12 bg-slate-50 border border-gray-200 rounded p-1 text-center font-mono text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => updateBasketQty(b._id!, 0, b.stockCount)}
                      className="text-red-400 hover:text-red-600 font-bold px-1 text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* POS Billing Controls */}
        <div className="border-t border-gray-150 pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2 bg-[#fcfaf4] p-1 rounded-lg border border-[#eadecc]">
              <button
                onClick={() => setBillToPatient(true)}
                className={`flex-1 text-[10px] font-bold py-1.5 rounded-md ${billToPatient ? "bg-[#0f6266] text-white" : "text-gray-500"}`}
              >
                Bill to Patient
              </button>
              <button
                onClick={() => setBillToPatient(false)}
                className={`flex-1 text-[10px] font-bold py-1.5 rounded-md ${!billToPatient ? "bg-[#0f6266] text-white" : "text-gray-500"}`}
              >
                Bill to Other
              </button>
            </div>

            {billToPatient ? (
              <input
                type="text"
                placeholder="Enter Patient ID / MRN"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Person Name"
                  value={billeeName}
                  onChange={(e) => setBilleeName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={billeePhone}
                  onChange={(e) => setBilleePhone(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f6266]"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as "paid" | "unpaid")
                }
                className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none text-slate-700"
              >
                <option value="paid">✓ Mark as PAID</option>
                <option value="unpaid">⚠️ Mark as UNPAID (Due)</option>
              </select>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={paymentStatus === "unpaid"}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none text-slate-700 disabled:opacity-50"
              >
                <option value="UPI">UPI / Paytm QR</option>
                <option value="Cash">Physical Cash</option>
                <option value="Card">Credit / Debit Card</option>
              </select>
            </div>

            {paymentMethod === "UPI" && grandTotal > 0 && (
              <div className="border border-dashed border-[#eadecc] p-1.5 rounded-lg bg-white shadow-sm flex flex-col items-center">
                <img
                  src={qrCodeImage}
                  alt="Paytm/UPI QR"
                  className="w-16 h-16 object-contain"
                />
                <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  Scan & Pay
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-[#0e1e38] bg-[#fcfaf4] p-3 rounded-xl border border-[#eadecc]/60">
            <span>Grand Aggregate Bill Due</span>
            <span className="font-mono text-base text-emerald-600">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckoutDispense}
            disabled={isProcessing}
            className="w-full bg-[#0f6266] text-white font-bold text-xs py-3 rounded-xl hover:bg-[#0b4a4d] transition-colors shadow-md cursor-pointer disabled:bg-slate-400"
          >
            {isProcessing
              ? "Generating PDF Invoice..."
              : "Execute Dispense & Print Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
