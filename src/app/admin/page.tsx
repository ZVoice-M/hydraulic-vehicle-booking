"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, Lock, Search, ShieldCheck } from "lucide-react";
import { useBookingStore } from "@/lib/useBookingStore";
import { Booking } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const { vehicles, bookings } = useBookingStore();
  const [filters, setFilters] = useState({ date: "", vehicle: "all", zone: "", fellowship: "", status: "all", search: "" });

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const vehicle = vehicles.find((item) => item.id === booking.vehicle_id);
      const searchText = `${vehicle?.name} ${booking.incharge_name} ${booking.mobile_number} ${booking.zone} ${booking.fellowship}`.toLowerCase();
      return (
        (!filters.date || booking.booking_date === filters.date) &&
        (filters.vehicle === "all" || booking.vehicle_id === filters.vehicle) &&
        (!filters.zone || booking.zone.toLowerCase().includes(filters.zone.toLowerCase())) &&
        (!filters.fellowship || booking.fellowship.toLowerCase().includes(filters.fellowship.toLowerCase())) &&
        (filters.status === "all" || booking.status === filters.status) &&
        (!filters.search || searchText.includes(filters.search.toLowerCase()))
      );
    });
  }, [bookings, filters, vehicles]);

  const stats = {
    total: bookings.length,
    active: bookings.filter((booking) => booking.status === "active").length,
    overdue: bookings.filter((booking) => booking.status === "overdue").length,
    completed: bookings.filter((booking) => booking.status === "completed").length
  };

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-4">
        <form
          className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-card"
          onSubmit={(event) => {
            event.preventDefault();
            const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
            if (password === expected) setAuthenticated(true);
            else alert("Invalid admin password");
          }}
        >
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-ink">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-muted">Admin login is required for full booking history, filters, utilization, and export.</p>
          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-semibold text-ink">Password</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white">
            <ShieldCheck className="h-4 w-4" />
            Login
          </button>
          <p className="mt-4 text-xs text-muted">Demo password fallback: admin123. Set NEXT_PUBLIC_ADMIN_PASSWORD before deployment.</p>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <section className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">Secure admin view</p>
            <h1 className="text-2xl font-bold text-ink sm:text-4xl">Vehicle Operations Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <a className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink" href="/">User View</a>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white" onClick={() => exportCsv(filtered, vehicles)}>
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-4">
          <Stat label="All Bookings" value={stats.total} />
          <Stat label="Active" value={stats.active} />
          <Stat label="Overdue" value={stats.overdue} />
          <Stat label="Completed" value={stats.completed} />
        </section>

        <section className="grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Date</span>
            <input className="input" type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Vehicle</span>
            <select className="input" value={filters.vehicle} onChange={(e) => setFilters({ ...filters, vehicle: e.target.value })}>
              <option value="all">All</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Zone</span>
            <input className="input" value={filters.zone} onChange={(e) => setFilters({ ...filters, zone: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Fellowship</span>
            <input className="input" value={filters.fellowship} onChange={(e) => setFilters({ ...filters, fellowship: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Status</span>
            <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" />
              <input className="input pl-9" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
          </label>
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-muted">
                <tr>
                  {["Vehicle", "Incharge Name", "Mobile Number", "Zone", "Fellowship", "Start Time", "End Time", "Duration", "Status", "Created At"].map((header) => (
                    <th key={header} className="px-4 py-3">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((booking) => {
                  const vehicle = vehicles.find((item) => item.id === booking.vehicle_id);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-ink">{vehicle?.name ?? booking.vehicle_id}</td>
                      <td className="px-4 py-3">{booking.incharge_name}</td>
                      <td className="px-4 py-3">{booking.mobile_number}</td>
                      <td className="px-4 py-3">{booking.zone}</td>
                      <td className="px-4 py-3">{booking.fellowship}</td>
                      <td className="px-4 py-3">{booking.booking_date} {booking.start_time}</td>
                      <td className="px-4 py-3">{booking.booking_date} {booking.end_time}</td>
                      <td className="px-4 py-3">{formatDuration(booking.duration)}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold capitalize">{booking.status}</span></td>
                      <td className="px-4 py-3">{format(parseISO(booking.created_at), "dd MMM yyyy, HH:mm")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

function exportCsv(bookings: Booking[], vehicles: { id: string; name: string }[]) {
  const rows = [
    ["Vehicle", "Incharge Name", "Mobile Number", "Zone", "Fellowship", "Start Time", "End Time", "Duration", "Status", "Created At"],
    ...bookings.map((booking) => {
      const vehicle = vehicles.find((item) => item.id === booking.vehicle_id);
      return [vehicle?.name ?? booking.vehicle_id, booking.incharge_name, booking.mobile_number, booking.zone, booking.fellowship, `${booking.booking_date} ${booking.start_time}`, `${booking.booking_date} ${booking.end_time}`, String(booking.duration), booking.status, booking.created_at];
    })
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hydraulic-vehicle-bookings.csv";
  link.click();
  URL.revokeObjectURL(url);
}
