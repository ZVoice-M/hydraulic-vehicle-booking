"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { Clock, Send } from "lucide-react";
import { MAX_ADVANCE_BOOKING_DAYS, MAX_BOOKING_HOURS } from "../../config/bookingRules";
import { Booking, BookingFormInput, Vehicle } from "@/lib/types";
import { cn, formatDuration, getBookingDateTime, getVehicleAccent, minutesBetween } from "@/lib/utils";
import { Modal } from "./Modal";

export function BookingModal({
  vehicle,
  bookings,
  onClose,
  onSubmit,
  defaultMobile,
  onMobileChange
}: {
  vehicle: Vehicle;
  bookings: Booking[];
  onClose: () => void;
  onSubmit: (input: BookingFormInput) => void;
  defaultMobile: string;
  onMobileChange: (value: string) => void;
}) {
  const today = new Date();
  const [form, setForm] = useState<BookingFormInput>({
    vehicle_id: vehicle.id,
    incharge_name: "",
    mobile_number: defaultMobile,
    zone: "",
    fellowship: "",
    booking_date: format(today, "yyyy-MM-dd"),
    start_time: format(new Date(today.getTime() + 60 * 60 * 1000), "HH:00"),
    end_time: format(new Date(today.getTime() + 2 * 60 * 60 * 1000), "HH:00"),
    purpose: ""
  });

  const start = getBookingDateTime(form, "start");
  const end = getBookingDateTime(form, "end");
  const duration = minutesBetween(start, end);
  const exceeds = duration > MAX_BOOKING_HOURS * 60;
  const accent = getVehicleAccent(vehicle.color);
  const schedule = useMemo(
    () => bookings.filter((booking) => booking.vehicle_id === vehicle.id && booking.booking_date === form.booking_date && booking.status !== "completed"),
    [bookings, form.booking_date, vehicle.id]
  );

  function update<K extends keyof BookingFormInput>(key: K, value: BookingFormInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "mobile_number") onMobileChange(String(value));
  }

  return (
    <Modal title={`Book ${vehicle.name}`} subtitle="You can book vehicles only up to 2 days in advance." onClose={onClose}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className={cn("rounded-2xl border p-4", accent.border, accent.soft)}>
          <div className="flex items-center justify-between">
            <p className={cn("text-sm font-bold", accent.text)}>{vehicle.name}</p>
            <p className="text-sm font-semibold text-ink">Duration: {duration > 0 ? formatDuration(duration) : "Select time"}</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div className={cn("h-full rounded-full", exceeds ? "bg-red-600" : accent.bar)} style={{ width: `${Math.min(100, Math.max(8, (duration / (MAX_BOOKING_HOURS * 60)) * 100))}%` }} />
          </div>
          {exceeds && <p className="mt-2 text-sm font-semibold text-red-700">Maximum booking duration is {MAX_BOOKING_HOURS} hours.</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Incharge Name"><input className="input" value={form.incharge_name} onChange={(e) => update("incharge_name", e.target.value)} required /></Field>
          <Field label="Mobile Number"><input className="input" inputMode="numeric" value={form.mobile_number} onChange={(e) => update("mobile_number", e.target.value)} required /></Field>
          <Field label="Zone"><input className="input" value={form.zone} onChange={(e) => update("zone", e.target.value)} required /></Field>
          <Field label="Fellowship"><input className="input" value={form.fellowship} onChange={(e) => update("fellowship", e.target.value)} required /></Field>
          <Field label="Booking Date">
            <input className="input" type="date" min={format(today, "yyyy-MM-dd")} max={format(addDays(today, MAX_ADVANCE_BOOKING_DAYS), "yyyy-MM-dd")} value={form.booking_date} onChange={(e) => update("booking_date", e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start"><input className="input" type="time" value={form.start_time} onChange={(e) => update("start_time", e.target.value)} required /></Field>
            <Field label="End"><input className="input" type="time" value={form.end_time} onChange={(e) => update("end_time", e.target.value)} required /></Field>
          </div>
        </div>

        <Field label="Purpose / Notes">
          <textarea className="input min-h-24 resize-none" value={form.purpose} onChange={(e) => update("purpose", e.target.value)} placeholder="Optional" />
        </Field>

        <div className="rounded-2xl border border-line bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><Clock className="h-4 w-4" /> Visual timeline</div>
          {schedule.length ? (
            <div className="space-y-2">
              {schedule.map((booking) => (
                <div key={booking.id} className="rounded-xl bg-white px-3 py-2 text-sm text-ink">
                  <span className="font-semibold">{booking.start_time} - {booking.end_time}</span>
                  <span className="text-muted"> · {booking.incharge_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No bookings on this date.</p>
          )}
        </div>

        <button disabled={exceeds || duration <= 0} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
          <Send className="h-4 w-4" />
          Confirm Booking
        </button>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
