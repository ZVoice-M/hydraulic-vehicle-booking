export type VehicleColor = "blue" | "yellow" | "red" | "green";

export type Vehicle = {
  id: string;
  name: string;
  color: VehicleColor;
  status: "available" | "in_use";
};

export type BookingStatus = "active" | "upcoming" | "completed" | "overdue";

export type Booking = {
  id: string;
  vehicle_id: string;
  incharge_name: string;
  mobile_number: string;
  zone: string;
  fellowship: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: BookingStatus;
  purpose?: string;
  actual_total_hours?: number;
  completed_at?: string;
  created_at: string;
};

export type BookingFormInput = Omit<Booking, "id" | "duration" | "status" | "completed_at" | "created_at">;

export type BookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; message: string };
