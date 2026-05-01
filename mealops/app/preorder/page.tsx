"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  Info
} from "lucide-react";
import { getTodayMenu } from "@/data/menu-week";

export default function PreOrderPage() {
  const [cart, setCart] = useState<number[]>([]);
  const [orderStatus, setOrderStatus] = useState<"idle" | "success">("idle");
  const todayMenu = getTodayMenu();

  // Combine lunch and dinner items for pre-order
  const availableItems = [
    ...todayMenu.lunch.items.map(i => ({ ...i, type: "Lunch" })),
    ...todayMenu.dinner.items.map(i => ({ ...i, type: "Dinner" }))
  ];

  const toggleItem = (id: number) => {
    setCart(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleOrder = () => {
    if (cart.length === 0) return;
    setOrderStatus("success");
    // In a real app, this would send an API request
  };

  if (orderStatus === "success") {
    return (
      <div className="p-6 md:p-8 max-w-lg mx-auto flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
          <CheckCircle2 size={40} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Placed!</h1>
          <p className="text-slate-500 mt-2">Your pre-order has been reserved. Please scan this QR code at the counter during meal time.</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-soft">
          <QrCode size={180} className="text-slate-900" />
          <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-[0.2em]">Order ID: ORD-29402-X</p>
        </div>

        <button 
          onClick={() => { setOrderStatus("idle"); setCart([]); }}
          className="w-full bg-primary-500 text-white rounded-2xl p-4 font-bold shadow-soft hover:bg-primary-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="text-primary-500" size={24} />
            Pre-order
          </h1>
          <p className="text-slate-500 text-sm mt-1">Reserve your meal ahead of time</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-700">
        <AlertCircle className="shrink-0" size={20} />
        <div className="text-xs leading-relaxed">
          <p className="font-bold">Meal Timings Reminder</p>
          <p className="mt-0.5">Orders must be placed at least 1 hour before meal start time.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Available for Today</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {availableItems.map((item) => {
              const selected = cart.includes(item.id);
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                    selected ? "bg-primary-50 border-primary-200 shadow-glow" : "bg-white border-slate-100 shadow-card"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.type === "Lunch" ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"
                    }`}>
                      {item.type}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected ? "bg-primary-500 border-primary-500 text-white" : "border-slate-200"
                    }`}>
                      {selected && <CheckCircle2 size={12} strokeWidth={3} />}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{item.calories} kcal</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40"
          >
            <div className="bg-slate-900 shadow-2xl rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Checkout</p>
                  <p className="text-lg font-bold">{cart.length} Items Selected</p>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="text-primary-400" size={20} />
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin size={12} />
                  <span>Main Campus Hostel Canteen</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock size={12} />
                  <span>Available during meal hours</span>
                </div>
              </div>

              <button 
                onClick={handleOrder}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 group"
              >
                Confirm Pre-order
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-50 rounded-2xl p-5 flex gap-4 border border-slate-100">
         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
            <Info size={20} className="text-slate-400" />
         </div>
         <p className="text-xs text-slate-500 leading-relaxed">
            Pre-ordering helps the mess staff plan portions better, reducing food waste by up to 15%. Thank you for being a responsible diner!
         </p>
      </div>
    </div>
  );
}
