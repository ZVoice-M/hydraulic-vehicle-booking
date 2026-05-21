import { addMinutes, differenceInMinutes, format, isAfter, isBefore, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import { HANDOVER_BUFFER_MINUTES, MAX_BOOKING_HOURS, MAX_BOOKINGS_PER_DAY, MAX_SIMULTANEOUS_VEHICLES } from "../../config/bookingRules";
import { Booking, BookingFormInput, BookingResult, VehicleColor } from "./types";

export const bookingRulesText = `${MAX_BOOKING_HOURS}h max · ${MAX_BOOKINGS_PER_DAY}/day`;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBookingDateTime(booking: Pick<Booking, "booking_date" | "start_time" | "end_time">, edge: "start" | "end") {
  return parseISO(`${booking.booking_date}T${edge === "start" ? booking.start_time : booking.end_time}:00`);
}

export function minutesBetween(start: Date, end: Date) {
  return differenceInMinutes(end, start);
}

export function formatDuration(minutes: number) {
  const abs = Math.max(0, Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getActiveBooking(vehicleId: string, bookings: Booking[]) {
  const now = new Date();
  return bookings.find((booking) => {
    if (booking.vehicle_id !== vehicleId || booking.status === "completed") return false;
    return !isBefore(now, getBookingDateTime(booking, "start")) && !isAfter(now, getBookingDateTime(booking, "end"));
  });
}

export function getCurrentHolder(vehicleId: string, bookings: Booking[]) {
  return getActiveBooking(vehicleId, bookings) ?? bookings
    .filter((booking) => booking.vehicle_id === vehicleId && booking.status !== "completed")
    .sort((a, b) => getBookingDateTime(a, "start").getTime() - getBookingDateTime(b, "start").getTime())[0];
}

export function getVehicleAccent(color: VehicleColor) {
  const map = {
    blue: { bar: "bg-blue-600", soft: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", ring: "ring-blue-100" },
    yellow: { bar: "bg-yellow-500", soft: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", ring: "ring-yellow-100" },
    red: { bar: "bg-red-600", soft: "bg-red-50", text: "text-red-700", border: "border-red-200", ring: "ring-red-100" },
    green: { bar: "bg-emerald-600", soft: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", ring: "ring-emerald-100" }
  };
  return map[color];
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

export function validateBooking(input: BookingFormInput, bookings: Booking[]): BookingResult {
  const now = new Date();
  const start = getBookingDateTime(input, "start");
  const end = getBookingDateTime(input, "end");
  const duration = minutesBetween(start, end);
  const sameDate = bookings.filter((booking) => booking.booking_date === input.booking_date && booking.status !== "completed");
  const phone = normalizePhone(input.mobile_number);
  const zone = input.zone.trim().toLowerCase();

  if (!input.incharge_name.trim() || phone.length !== 10 || !input.zone.trim() || !input.fellowship.trim()) {
    return { ok: false, message: "Please fill in name, valid mobile number, zone, and fellowship." };
  }
  if (duration <= 0) return { ok: false, message: "End time must be after start time." };
  if (duration > MAX_BOOKING_HOURS * 60) return { ok: false, message: `Maximum booking duration is ${MAX_BOOKING_HOURS} hours.` };
  if (format(now, "yyyy-MM-dd") === input.booking_date && isBefore(start, now)) {
    return { ok: false, message: "Past time bookings are not allowed." };
  }

  const ownBookingsToday = sameDate.filter((booking) => normalizePhone(booking.mobile_number) === phone || booking.zone.trim().toLowerCase() === zone);
  if (ownBookingsToday.length >= MAX_BOOKINGS_PER_DAY) {
    return { ok: false, message: `Same mobile number or zone can book only ${MAX_BOOKINGS_PER_DAY} vehicles per day.` };
  }

  const overlaps = sameDate.filter((booking) => {
    const bufferedStart = addMinutes(getBookingDateTime(booking, "start"), -HANDOVER_BUFFER_MINUTES);
    const bufferedEnd = addMinutes(getBookingDateTime(booking, "end"), HANDOVER_BUFFER_MINUTES);
    return isBefore(start, bufferedEnd) && isAfter(end, bufferedStart);
  });

  if (overlaps.some((booking) => booking.vehicle_id === input.vehicle_id)) {
    return { ok: false, message: `This vehicle already has a booking in that slot, including ${HANDOVER_BUFFER_MINUTES} minutes handover buffer.` };
  }

  const simultaneousOwn = overlaps.filter((booking) => normalizePhone(booking.mobile_number) === phone || booking.zone.trim().toLowerCase() === zone);
  if (simultaneousOwn.length >= MAX_SIMULTANEOUS_VEHICLES) {
    return { ok: false, message: `Same mobile number or zone can hold only ${MAX_SIMULTANEOUS_VEHICLES} vehicles at the same time.` };
  }

  return {
    ok: true,
    booking: {
      ...input,
      id: `BK-${Date.now().toString().slice(-6)}`,
      mobile_number: phone,
      duration,
      status: isBefore(start, now) && isAfter(end, now) ? "active" : "upcoming",
      created_at: new Date().toISOString()
    }
  };
}

export function updateBookingStatuses(bookings: Booking[]) {
  const now = new Date();
  return bookings.map((booking) => {
    if (booking.status === "completed") return booking;
    const start = getBookingDateTime(booking, "start");
    const end = getBookingDateTime(booking, "end");
    if (isBefore(now, start)) return { ...booking, status: "upcoming" as const };
    if (isAfter(now, end)) return { ...booking, status: "overdue" as const };
    return { ...booking, status: "active" as const };
  });
}
