"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Booking, BookingFormInput } from "./types";
import { seedBookings, seedVehicles } from "./seed";
import { supabase } from "./supabase";
import { getBookingDateTime, minutesBetween, updateBookingStatuses, validateBooking } from "./utils";

const BOOKINGS_KEY = "hydraulic-bookings-v1";
const CHANNEL = "hydraulic-realtime";

export function useBookingStore() {
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [baseVehicles, setBaseVehicles] = useState(seedVehicles);
  const clientId = useRef(typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()));

  useEffect(() => {
    if (supabase) {
      const client = supabase;
      client.from("vehicles").select("*").order("id", { ascending: true }).then(({ data, error }) => {
        if (!error && data?.length) setBaseVehicles(data as typeof seedVehicles);
      });
      client.from("bookings").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
        if (!error && data) setBookings(updateBookingStatuses(data as Booking[]));
      });
      const channel = client
        .channel("booking-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
          client.from("bookings").select("*").order("created_at", { ascending: false }).then(({ data }) => {
            if (data) setBookings(updateBookingStatuses(data as Booking[]));
          });
        })
        .subscribe();
      return () => {
        client.removeChannel(channel);
      };
    }

    const saved = window.localStorage.getItem(BOOKINGS_KEY);
    if (saved) setBookings(updateBookingStatuses(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setBookings((items) => updateBookingStatuses(items)), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (supabase) return;
    window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ clientId: clientId.current, bookings });
    channel.close();
  }, [bookings]);

  useEffect(() => {
    if (supabase) return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event) => {
      if (event.data?.clientId === clientId.current) return;
      setBookings(updateBookingStatuses(event.data?.bookings ?? []));
    };
    return () => channel.close();
  }, []);

  const vehicles = useMemo(() => {
    return baseVehicles.map((vehicle) => ({
      ...vehicle,
      status: bookings.some((booking) => booking.vehicle_id === vehicle.id && booking.status === "active") ? "in_use" as const : "available" as const
    }));
  }, [baseVehicles, bookings]);

  function createBooking(input: BookingFormInput) {
    const result = validateBooking(input, bookings);
    if (!result.ok) return result;
    setBookings((items) => updateBookingStatuses([...items, result.booking]));
    if (supabase) {
      supabase.from("bookings").insert(result.booking).then(({ error }) => {
        if (error) console.error("Supabase booking insert failed", error);
      });
    }
    return result;
  }

  function completeBooking(bookingId: string) {
    const existing = bookings.find((booking) => booking.id === bookingId);
    const now = new Date();
    const completed = existing
      ? {
          ...existing,
          status: "completed" as const,
          completed_at: now.toISOString(),
          actual_total_hours: Math.max(0, minutesBetween(getBookingDateTime(existing, "start"), now)) / 60
        }
      : undefined;

    setBookings((items) =>
      items.map((booking) => {
        if (booking.id !== bookingId) return booking;
        return completed ?? booking;
      })
    );
    if (supabase && completed) {
      supabase
        .from("bookings")
        .update({ status: "completed", completed_at: completed.completed_at, actual_total_hours: completed.actual_total_hours })
        .eq("id", bookingId)
        .then(({ error }) => {
          if (error) console.error("Supabase booking completion failed", error);
        });
    }
  }

  return { vehicles, bookings, createBooking, completeBooking };
}