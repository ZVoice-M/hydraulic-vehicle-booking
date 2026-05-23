"use client";

import { Phone, Send, KeyRound, Plus } from "lucide-react";
import { format } from "date-fns";
import { Booking, Vehicle } from "@/lib/types";
import { formatDisplayTime, formatDuration, getActiveBooking, getBookingDateTime, getCurrentHolder, minutesBetween, userOwnsBooking } from "@/lib/utils";
import { Modal } from "./Modal";
import { REQUIRE_MOBILE_CONFIRMATION_BEFORE_COMPLETION } from "../../config/bookingRules";

export function DetailModal({ vehicle, bookings, currentMobile, onClose, onBook, onComplete }: { vehicle: Vehicle; bookings: Booking[]; currentMobile: string; onClose: () => void; onBook: () => void; onComplete: (bookingId: string, confirmedMobile?: string) => void }) {
  const active = getActiveBooking(vehicle.id, bookings);
  const holder = getCurrentHolder(vehicle.id, bookings);
  const canCompleteActive = userOwnsBooking(active, currentMobile);
  const today = format(new Date(), "yyyy-MM-dd");
  const schedule = bookings
    .filter((booking) => booking.vehicle_id === vehicle.id && booking.booking_date === today && booking.status !== "completed")
    .sort((a, b) => getBookingDateTime(a, "start").getTime() - getBookingDateTime(b, "start").getTime());
  const availableSlots = buildAvailableSlots(schedule);
  const remainingMinutes = active ? minutesBetween(new Date(), getBookingDateTime(active, "end")) : 0;

  return (
    <Modal title={vehicle.name} subtitle="Today schedule, active holder, and key handover contact." onClose={onClose}>
      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-gray-50 p-4">
          <p className="text-sm font-bold text-ink">Current active booking</p>
          {active ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-lg font-bold text-ink">{active.incharge_name}</p>
              <p className="text-muted">{active.zone} - {active.fellowship}</p>
              <p className="font-semibold text-ink">{formatDisplayTime(active.start_time)} - {formatDisplayTime(active.end_time)}</p>
              {remainingMinutes > 0 && <p className="font-bold text-red-700">{formatDuration(remainingMinutes)} remaining</p>}
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-emerald-700">Available now</p>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-4">
          <p className="text-sm font-bold text-ink">Current key holder contact</p>
          <div className="mt-3">
            <p className="font-bold text-ink">{holder.isDefaultCoordinator ? `Contact ${holder.name}` : holder.name}</p>
            <p className="text-sm text-muted">{holder.mobile_number}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white" href={`tel:${holder.mobile_number}`}>
                <Phone className="h-4 w-4" /> Call
              </a>
              <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink" href={`https://wa.me/91${holder.mobile_number}`} target="_blank">
                <Send className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-3 text-sm font-bold text-ink">Today&apos;s schedule</p>
          <div className="space-y-2">
            {schedule.length ? schedule.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-line bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-ink">{formatDisplayTime(booking.start_time)} - {formatDisplayTime(booking.end_time)}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold capitalize text-muted">{booking.status}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{booking.incharge_name} - {booking.zone}</p>
              </div>
            )) : <p className="rounded-xl bg-gray-50 p-4 text-sm text-muted">No bookings today. Available slots are open.</p>}
          </div>
        </section>

        <section>
          <p className="mb-3 text-sm font-bold text-ink">Available slots today</p>
          <div className="flex flex-wrap gap-2">
            {availableSlots.map((slot) => (
              <span key={slot} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{slot}</span>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white" onClick={onBook}>
            <Plus className="h-4 w-4" /> Book Vehicle
          </button>
          {active && canCompleteActive && (
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink" onClick={() => {
              const confirmedMobile = REQUIRE_MOBILE_CONFIRMATION_BEFORE_COMPLETION ? window.prompt("Confirm your registered mobile number") ?? "" : currentMobile;
              if (window.confirm("Have you handed over the keys?")) onComplete(active.id, confirmedMobile);
            }}>
              <KeyRound className="h-4 w-4" /> Complete
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function buildAvailableSlots(schedule: Booking[]) {
  const slots: string[] = [];
  let cursor = "06:00";
  for (const booking of schedule) {
    if (cursor < booking.start_time) slots.push(`${cursor} - ${booking.start_time}`);
    if (booking.end_time > cursor) cursor = booking.end_time;
  }
  if (cursor < "22:00") slots.push(`${cursor} - 22:00`);
  return slots.length ? slots : ["No open slots"];
}
