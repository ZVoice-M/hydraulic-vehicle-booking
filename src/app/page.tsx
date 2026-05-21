"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Car, Clock, History, KeyRound, LayoutDashboard, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { addDays, format, isSameDay, parseISO } from "date-fns";
import { bookingRulesText, cn, formatDuration, getActiveBooking, getBookingDateTime, getCurrentHolder, getVehicleAccent, minutesBetween } from "@/lib/utils";
import { Booking, BookingFormInput, Vehicle } from "@/lib/types";
import { useBookingStore } from "@/lib/useBookingStore";
import { BookingModal } from "@/components/BookingModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { DetailModal } from "@/components/DetailModal";
import { MyBookingsModal } from "@/components/MyBookingsModal";

export default function HomePage() {
  const { vehicles, bookings, createBooking, completeBooking } = useBookingStore();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [mobileIdentity, setMobileIdentity] = useState("");

  const today = useMemo(() => new Date(), []);
  const todayBookings = useMemo(
    () => bookings.filter((booking) => isSameDay(parseISO(booking.booking_date), today)),
    [bookings, today]
  );

  function handleBook(input: BookingFormInput) {
    const result = createBooking(input);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Vehicle booked successfully");
    setBookingVehicle(null);
    setConfirmedBooking(result.booking);
  }

  function vehicleStatus(vehicle: Vehicle) {
    return getActiveBooking(vehicle.id, bookings) ? "in_use" : "available";
  }

  return (
    <main className="min-h-screen bg-surface">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-28 pt-5 sm:px-6 lg:px-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
              <KeyRound className="h-3.5 w-3.5" />
              Key handover made clear
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-4xl">Hydraulic Vehicle Booking</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              Check availability, see who has the keys, book a vehicle, and complete handover without late-night coordination calls.
            </p>
          </div>
          <a
            href="/admin"
            className="hidden items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-gray-300 sm:flex"
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin
          </a>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <InfoPill icon={<CalendarDays className="h-4 w-4" />} label="Today" value={format(today, "EEE, dd MMM")} />
          <InfoPill icon={<Clock className="h-4 w-4" />} label="Booking Window" value={`${format(today, "dd MMM")} - ${format(addDays(today, 2), "dd MMM")}`} />
          <InfoPill icon={<Car className="h-4 w-4" />} label="Rules" value={bookingRulesText} />
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          {vehicles.map((vehicle) => {
            const active = getActiveBooking(vehicle.id, bookings);
            const status = vehicleStatus(vehicle);
            const accent = getVehicleAccent(vehicle.color);
            const schedule = todayBookings
              .filter((booking) => booking.vehicle_id === vehicle.id)
              .sort((a, b) => getBookingDateTime(a, "start").getTime() - getBookingDateTime(b, "start").getTime());
            return (
              <article
                key={vehicle.id}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <button className="w-full p-0 text-left" onClick={() => setSelectedVehicle(vehicle)}>
                  <div className={cn("h-2", accent.bar)} />
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", accent.soft)}>
                          <Car className={cn("h-6 w-6", accent.text)} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{vehicle.id}</p>
                          <h2 className="text-lg font-bold text-ink">{vehicle.name}</h2>
                        </div>
                      </div>
                      <StatusBadge status={status} />
                    </div>
