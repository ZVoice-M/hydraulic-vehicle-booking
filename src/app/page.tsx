"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Car, Clock, History, KeyRound, LayoutDashboard, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { addDays, format, isSameDay, parseISO } from "date-fns";
import { bookingRulesText, cn, formatDuration, getActiveBooking, getBookingDateTime, getCurrentHolder, getVehicleAccent, minutesBetween, userOwnsBooking } from "@/lib/utils";
import { REQUIRE_MOBILE_CONFIRMATION_BEFORE_COMPLETION } from "../../config/bookingRules";
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

  useEffect(() => {
    setMobileIdentity(window.localStorage.getItem("hydraulic-user-mobile") ?? "");
  }, []);

  useEffect(() => {
    if (mobileIdentity) window.localStorage.setItem("hydraulic-user-mobile", mobileIdentity);
  }, [mobileIdentity]);

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

                    <div className="mt-5 rounded-xl border border-line bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current booking</p>
                      {active ? (
                        <div className="mt-2 space-y-2">
                          <p className="font-semibold text-ink">{active.incharge_name}</p>
                          <p className="text-sm text-muted">
                            {active.start_time} - {active.end_time} - {active.zone} - {active.fellowship}
                          </p>
                          <LiveTimer booking={active} />
                        </div>
                      ) : (
                        <p className="mt-2 text-sm font-medium text-emerald-700">Available now for booking</p>
                      )}
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-sm font-semibold text-ink">Today&apos;s schedule</p>
                      {schedule.length ? (
                        <div className="space-y-2">
                          {schedule.slice(0, 3).map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                              <span className="font-medium text-ink">{booking.start_time} - {booking.end_time}</span>
                              <span className="truncate pl-3 text-muted">{booking.incharge_name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-muted">No bookings today</p>
                      )}
                    </div>
                  </div>
                </button>
                <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                    onClick={() => setBookingVehicle(vehicle)}
                  >
                    <Plus className="h-4 w-4" />
                    Book Vehicle
                  </button>
                  {active ? (
                    userOwnsBooking(active, mobileIdentity) ? (
                      <button
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-gray-300"
                        onClick={() => {
                          const confirmedMobile = REQUIRE_MOBILE_CONFIRMATION_BEFORE_COMPLETION ? window.prompt("Confirm your registered mobile number") ?? "" : mobileIdentity;
                          if (window.confirm("Have you handed over the keys?")) {
                            const result = completeBooking(active.id, mobileIdentity, confirmedMobile);
                            if (result.ok) toast.success("Booking completed and vehicle marked available");
                            else toast.error(result.message);
                          }
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                        Complete
                      </button>
                    ) : (
                      <button
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-gray-300"
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <Search className="h-4 w-4" />
                        Details
                      </button>
                    )
                  ) : (
                    <button
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-gray-300"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <Search className="h-4 w-4" />
                      Details
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </section>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(17,24,39,0.08)] sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <button className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-ink" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <Car className="h-5 w-5" />
            Vehicles
          </button>
          <button className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-ink" onClick={() => setMyBookingsOpen(true)}>
            <History className="h-5 w-5" />
            My Bookings
          </button>
          <a className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-ink" href="/admin">
            <LayoutDashboard className="h-5 w-5" />
            Admin
          </a>
        </div>
      </nav>

      <div className="fixed bottom-5 right-5 z-20 hidden sm:block">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-gray-800"
          onClick={() => setMyBookingsOpen(true)}
        >
          <History className="h-4 w-4" />
          My Bookings
        </button>
      </div>

      {bookingVehicle && (
        <BookingModal
          vehicle={bookingVehicle}
          bookings={bookings}
          onClose={() => setBookingVehicle(null)}
          onSubmit={handleBook}
          defaultMobile={mobileIdentity}
          onMobileChange={setMobileIdentity}
        />
      )}
      {selectedVehicle && (
        <DetailModal
          vehicle={selectedVehicle}
          bookings={bookings}
          currentMobile={mobileIdentity}
          onClose={() => setSelectedVehicle(null)}
          onBook={() => {
            setBookingVehicle(selectedVehicle);
            setSelectedVehicle(null);
          }}
          onComplete={(bookingId, confirmedMobile) => {
            const result = completeBooking(bookingId, mobileIdentity, confirmedMobile);
            if (result.ok) toast.success("Booking completed");
            else toast.error(result.message);
          }}
        />
      )}
      {confirmedBooking && (
        <ConfirmationModal
          booking={confirmedBooking}
          vehicle={vehicles.find((vehicle) => vehicle.id === confirmedBooking.vehicle_id)!}
          currentHolder={getCurrentHolder(confirmedBooking.vehicle_id, bookings)}
          onClose={() => setConfirmedBooking(null)}
        />
      )}
      {myBookingsOpen && (
        <MyBookingsModal
          mobile={mobileIdentity}
          onMobileChange={setMobileIdentity}
          bookings={bookings}
          vehicles={vehicles}
          onClose={() => setMyBookingsOpen(false)}
        />
      )}
    </main>
  );
}

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-ink">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "available" | "in_use" }) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-bold text-white", status === "available" ? "bg-emerald-600" : "bg-red-600")}>
      {status === "available" ? "AVAILABLE" : "IN USE"}
    </span>
  );
}

function LiveTimer({ booking }: { booking: Booking }) {
  const end = getBookingDateTime(booking, "end");
  const remaining = minutesBetween(new Date(), end);
  if (remaining <= 0) {
    return <p className="text-sm font-semibold text-red-700">Booking time exceeded</p>;
  }
  return <p className="text-sm font-semibold text-red-700">{formatDuration(remaining)} remaining</p>;
}
