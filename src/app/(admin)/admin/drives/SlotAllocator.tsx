"use client";

import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import {
  X, Plus, Loader2, Clock, MapPin, Trash2, Building2,
} from "lucide-react";
import { useState } from "react";

interface SlotEntry {
  timeSlot: string;
  classroom: string;
  departments: string[];
}

interface Props {
  driveId: string;
  departments: string[];
  onClose: () => void;
  onAllocated: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function SlotAllocator({ driveId, departments, onClose, onAllocated, showToast }: Props) {
  const [slots, setSlots] = useState<SlotEntry[]>([
    { timeSlot: "", classroom: "", departments: [] },
  ]);
  const [isAllocating, setIsAllocating] = useState(false);

  const updateSlot = (index: number, field: keyof SlotEntry, value: string | string[]) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const toggleSlotDept = (index: number, dept: string) => {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const depts = s.departments.includes(dept)
          ? s.departments.filter((d) => d !== dept)
          : [...s.departments, dept];
        return { ...s, departments: depts };
      })
    );
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, { timeSlot: "", classroom: "", departments: [] }]);
  };

  const removeSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAllocate = async () => {
    const valid = slots.filter((s) => s.timeSlot && s.departments.length > 0);
    if (valid.length === 0) {
      showToast("error", "Add at least one slot with time and departments");
      return;
    }
    setIsAllocating(true);
    try {
      await adminApi.allocateDriveSlots(driveId, valid);
      showToast("success", `${valid.length} slot(s) allocated successfully`);
      onAllocated();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to allocate slots");
    } finally {
      setIsAllocating(false);
    }
  };

  const TIME_PRESETS = [
    "9:00 AM - 11:00 AM",
    "11:00 AM - 1:00 PM",
    "1:00 PM - 3:00 PM",
    "2:00 PM - 4:00 PM",
    "3:00 PM - 5:00 PM",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] sticky top-0 bg-[#12121a] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/15 border border-orange-500/20">
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Allocate Slots</h2>
              <p className="text-white/40 text-xs">Assign time slots, classrooms & departments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {slots.map((slot, index) => (
            <div key={index} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center justify-center font-bold">{index + 1}</span>
                  Slot {index + 1}
                </h4>
                {slots.length > 1 && (
                  <button onClick={() => removeSlot(index)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Time Slot */}
              <div>
                <label className="block text-white/50 text-xs font-medium mb-1.5">
                  <Clock className="w-3 h-3 inline mr-1" /> Time Slot *
                </label>
                <input
                  value={slot.timeSlot}
                  onChange={(e) => updateSlot(index, "timeSlot", e.target.value)}
                  placeholder="e.g. 11:00 AM - 2:00 PM"
                  className="w-full px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {TIME_PRESETS.map((t) => (
                    <button
                      key={t}
                      onClick={() => updateSlot(index, "timeSlot", t)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                        slot.timeSlot === t
                          ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
                          : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06]"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Classroom */}
              <div>
                <label className="block text-white/50 text-xs font-medium mb-1.5">
                  <MapPin className="w-3 h-3 inline mr-1" /> Classroom
                </label>
                <input
                  value={slot.classroom}
                  onChange={(e) => updateSlot(index, "classroom", e.target.value)}
                  placeholder="e.g. Room 301, Seminar Hall A"
                  className="w-full px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange-500/40"
                />
              </div>

              {/* Departments */}
              <div>
                <label className="block text-white/50 text-xs font-medium mb-1.5">
                  <Building2 className="w-3 h-3 inline mr-1" /> Departments * (combine multiple for this slot)
                </label>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => toggleSlotDept(index, dept)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        slot.departments.includes(dept)
                          ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                          : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06]"
                      )}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
                {slot.departments.length > 1 && (
                  <p className="text-orange-300/60 text-[10px] mt-1">
                    Combined: {slot.departments.join(" + ")} for this time slot
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Add Slot Button */}
          <button
            onClick={addSlot}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/[0.08] rounded-xl text-white/40 text-sm font-medium hover:bg-white/[0.03] hover:border-white/[0.12] hover:text-white/60 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Another Slot
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-white/[0.06] sticky bottom-0 bg-[#12121a]">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button
            onClick={handleAllocate}
            disabled={isAllocating}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              isAllocating
                ? "bg-orange-600/30 text-orange-300/50 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-500 hover:to-amber-500"
            )}
          >
            {isAllocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            {isAllocating ? "Allocating..." : `Allocate ${slots.filter(s => s.timeSlot && s.departments.length > 0).length} Slot(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
