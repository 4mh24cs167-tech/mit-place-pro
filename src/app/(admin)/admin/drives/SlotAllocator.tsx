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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Allocate Slots</h2>
              <p className="text-xs text-muted-foreground">Assign time slots, classrooms & departments</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {slots.map((slot, index) => (
            <div key={index} className="i-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs flex items-center justify-center font-bold">{index + 1}</span>
                  Slot {index + 1}
                </h4>
                {slots.length > 1 && (
                  <button onClick={() => removeSlot(index)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Time Slot */}
              <div>
                <label className="block text-muted-foreground text-xs font-medium mb-1.5">
                  <Clock className="w-3 h-3 inline mr-1" /> Time Slot *
                </label>
                <input
                  value={slot.timeSlot}
                  onChange={(e) => updateSlot(index, "timeSlot", e.target.value)}
                  placeholder="e.g. 11:00 AM - 2:00 PM"
                  className="w-full px-3 py-2 border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-indigo-400 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {TIME_PRESETS.map((t) => (
                    <button
                      key={t}
                      onClick={() => updateSlot(index, "timeSlot", t)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                        slot.timeSlot === t
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-border text-muted-foreground hover:border-indigo-300"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Classroom */}
              <div>
                <label className="block text-muted-foreground text-xs font-medium mb-1.5">
                  <MapPin className="w-3 h-3 inline mr-1" /> Classroom
                </label>
                <input
                  value={slot.classroom}
                  onChange={(e) => updateSlot(index, "classroom", e.target.value)}
                  placeholder="e.g. Room 301, Seminar Hall A"
                  className="w-full px-3 py-2 border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Departments */}
              <div>
                <label className="block text-muted-foreground text-xs font-medium mb-1.5">
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
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-border text-foreground hover:border-indigo-300"
                      )}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
                {slot.departments.length > 1 && (
                  <p className="text-indigo-600 text-[10px] mt-1">
                    Combined: {slot.departments.join(" + ")} for this time slot
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Add Slot Button */}
          <button
            onClick={addSlot}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm font-medium hover:bg-muted/30 hover:border-indigo-200 hover:text-foreground transition-all"
          >
            <Plus className="w-4 h-4" /> Add Another Slot
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 p-5 border-t border-border sticky bottom-0 bg-white">
          <button
            onClick={handleAllocate}
            disabled={isAllocating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isAllocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            {isAllocating ? "Allocating..." : `Allocate ${slots.filter(s => s.timeSlot && s.departments.length > 0).length} Slot(s)`}
          </button>
          <button onClick={onClose}
            className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
