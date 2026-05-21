"use client";

import { Booking, Vehicle } from "@/lib/types";
import { normalizePhone } from "@/lib/utils";
import { Modal } from "./Modal";

export function MyBookingsModal({ mobile, onMobileChange, bookings, vehicles, onClose }: { mobile: string; onMobileChange: (value: string) => void; bookings: Booking[]; vehicles: Vehicle[]; onClose: () => void }) {
  const phone = normalizePhone(mobile);
  const mine = phone.length === 10 ? bookings.filter((booking) => normalizePhone(booking.mobile_number) === phone) : [];

  return (
    <Modal title="My Bookings" subtitle="Use your mobile number to see only your bookings." onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ink">Mobile Number</span>
          <input className="input" inputMode="numeric" value={mobile} onChange={(e) => onMobileChange(e.target.value)} placeholder="10 digit mobile number" />
        </label>
        <div className="space-y-2">
          {mine.length ? mine.map((booking) => {
            const vehicle = vehicles.find((item) => item.id === booking.vehicle_id);
            return (
              <div key={booking.id} className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-ink">{vehicle?.name ?? booking.vehicle_id}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold capitalize text-muted">{booking.status}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{booking.booking_date} · {booking.start_time} - {booking.end_time}</p>
                <p className="text-sm text-muted">{booking.zone} · {booking.fellowship}</p>
              </div>
            );
          }) : (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-muted">Enter your mobile number to view active, previous, and upcoming bookings.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
