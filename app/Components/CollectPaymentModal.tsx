'use client';

import React, { useState } from 'react';
import { settleUnpaidBill } from '@/app/actions';

interface CollectPaymentModalProps {
  bill: { _id: string; amount: number; description: string; name: string };
  onClose: () => void;
  onSuccess: () => void;
}

export default function CollectPaymentModal({ bill, onClose, onSuccess }: CollectPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [loading, setLoading] = useState<boolean>(false);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await settleUnpaidBill(bill._id, paymentMethod);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      alert(res.message);
    }
  };

  const upiUrl = `upi://pay?pa=hospitalcentral@upi&pn=Hospital%20Billing&am=${bill.amount.toFixed(2)}&cu=INR`;
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[3500] p-4">
      <div className="bg-white rounded-2xl p-6 border border-[#eadecc] w-full max-w-sm shadow-2xl relative text-slate-800 animate-in zoom-in-95 duration-150">
        <button onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
        
        <h2 className="text-xl font-bold text-[#0e1e38] font-serif mb-1">Collect Due Balance</h2>
        <p className="text-xs text-gray-400 mb-4">Process clearing inputs for active outstanding hospital balance accounts.</p>

        <div className="bg-[#fcfaf4] border border-[#eadecc]/60 p-3.5 rounded-xl space-y-1 mb-4 text-xs font-medium">
          <p className="text-gray-400 font-sans uppercase text-[9px] font-bold">Account Holder / Target Patient</p>
          <p className="text-[#0e1e38] font-bold text-sm">{bill.name}</p>
          <div className="flex justify-between items-center pt-2 border-t border-gray-150 mt-2 font-bold text-[#0e1e38]">
            <span>Aggregate Due Outstandings</span>
            <span className="font-mono text-sm text-red-500">₹{bill.amount.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleProcessPayment} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Active Payment Gateway</label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
            >
              <option value="UPI">UPI / Instant Paytm QR</option>
              <option value="Cash">Counter Hard Cash</option>
              <option value="Card">Terminal Swipe Credit/Debit</option>
            </select>
          </div>

          {/* Dynamic Interactive Scan Canvas Display */}
          {paymentMethod === 'UPI' && (
            <div className="border border-dashed border-[#eadecc] bg-[#fcfaf4] p-4 rounded-xl flex flex-col items-center justify-center space-y-2">
              <img src={qrImage} alt="Central Gateway Token QR" className="w-28 h-28 object-contain bg-white p-1.5 border rounded-lg shadow-sm" />
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Syncing Paytm Desk Node...</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-lg text-xs font-bold text-gray-500 cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm">
              {loading ? 'Clearing...' : 'Confirm Settle ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}