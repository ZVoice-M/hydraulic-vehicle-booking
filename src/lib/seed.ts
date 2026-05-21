import { addHours, format, subHours } from "date-fns";
import { Booking, Vehicle } from "./types";

export const seedVehicles: Vehicle[] = [
  { id: "HV-01", name: "Blue Vehicle", color: "blue", status: "available" },
  { id: "HV-02", name: "Yellow Vehicle", color: "yellow", status: "available" },
  { id: "HV-03", name: "Red Vehicle", color: "red", status: "available" },
  { id: "HV-04", name: "Green Vehicle", color: "green", status: "available" }
];

const today = new Date();
const activeStart = subHours(today, 1);
const activeEnd = addHours(today, 2);
const laterStart = addHours(today, 4);
const laterEnd = addHours(today, 6);

export const seedBookings: Booking[] = [
  {
    id: "BK-1001",
    vehicle_id: "HV-01",
    incharge_name: "Daniel Mathew",
    mobile_number: "9876543210",
    zone: "North Zone",
    fellowship: "Youth Fellowship",
    booking_date: format(today, "yyyy-MM-dd"),
    start_time: format(activeStart, "HH:mm"),
    end_time: format(activeEnd, "HH:mm"),
    duration: 180,
    status: "active",
    purpose: "Hospital support visit",
    created_at: subHours(today, 2).toISOString()
  },
  {
    id: "BK-1002",
    vehicle_id: "HV-02",
    incharge_name: "Grace Thomas",
    mobile_number: "9123456780",
    zone: "East Zone",
    fellowship: "Women Fellowship",
    booking_date: format(today, "yyyy-MM-dd"),
    start_time: format(laterStart, "HH:mm"),
    end_time: format(laterEnd, "HH:mm"),
    duration: 120,
    status: "upcoming",
    purpose: "Equipment transport",
    created_at: subHours(today, 3).toISOString()
  }
];
