"use client";

import { CheckCircle2, Phone, Send } from "lucide-react";
import { Booking, ContactInfo, Vehicle } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { Modal } from "./Modal";

export function ConfirmationModal({ booking, vehicle, currentHolder, onClose }: { booking: Booking; vehicle: Vehicle; currentHolder: ContactInfo; onClose: () => void }) {
  const contact = currentHolder;
  return (
    <Modal title="Booking confirmed" subtitle="Please contact current incharge for key handover." onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-8 w-8" />
          <div>
            <p className="font-bold">{vehicle.name}</p>
            <p className="text-sm">Booking ID: {booking.id}</p>
          </div>
        </div>
        <div className="grid gap-2 rounded-2xl border border-line bg-white p-4 text-sm">
          <Row label="Date" value={booking.booking_date} />
          <Row label="Time" value={`${booking.start_time} - ${booking.end_time}`} />
          <Row label="Duration" value={formatDuration(booking.duration)} />
          <Row label="Incharge" value={booking.incharge_name} />
          <Row label="Key Contact" value={contact.name} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white" href={`tel:${contact.mobile_number}`}>
            <Phone className="h-4 w-4" /> Call
          </a>
          <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink" href={`https://wa.me/91${contact.mobile_number}`} target="_blank">
            <Send className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-muted">{label}</span><span className="font-semibold text-ink">{value}</span></div>;
}
