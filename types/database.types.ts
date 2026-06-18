/**
 * Database types for the Kira schema (Phase 1).
 *
 * Hand-authored to match supabase/migrations exactly, in the shape the
 * Supabase JS client expects (`Database['public']['Tables'][...]`).
 *
 * When a live Supabase project is linked, this file can be regenerated:
 *   supabase gen types typescript --linked > types/database.types.ts
 *
 * Conventions:
 *  - `period` (daterange) is serialized by Supabase as a string, e.g.
 *    "[2026-07-01,2026-07-05)".
 *  - `start_date` / `end_date` / `total_days` are GENERATED from `period`,
 *    so they appear on Row only — never on Insert/Update.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CarCategory =
  | "economy"
  | "sedan"
  | "suv"
  | "luxury"
  | "van"
  | "pickup"
  | "sport";

export type TransmissionType = "manual" | "automatic";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Database {
  public: {
    Tables: {
      agency_settings: {
        Row: {
          id: string;
          name: string;
          name_ar: string | null;
          name_fr: string | null;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          phone: string | null;
          whatsapp_number: string | null;
          email: string | null;
          address: string | null;
          address_ar: string | null;
          lat: number | null;
          lng: number | null;
          currency: string;
          opening_hours: Json;
          social_links: Json;
          locales: string[];
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_ar?: string | null;
          name_fr?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          phone?: string | null;
          whatsapp_number?: string | null;
          email?: string | null;
          address?: string | null;
          address_ar?: string | null;
          lat?: number | null;
          lng?: number | null;
          currency?: string;
          opening_hours?: Json;
          social_links?: Json;
          locales?: string[];
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_ar?: string | null;
          name_fr?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          phone?: string | null;
          whatsapp_number?: string | null;
          email?: string | null;
          address?: string | null;
          address_ar?: string | null;
          lat?: number | null;
          lng?: number | null;
          currency?: string;
          opening_hours?: Json;
          social_links?: Json;
          locales?: string[];
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cars: {
        Row: {
          id: string;
          slug: string;
          name: string;
          name_ar: string | null;
          brand: string;
          model: string;
          year: number;
          category: CarCategory;
          transmission: TransmissionType;
          fuel_type: string;
          seats: number;
          doors: number;
          price_per_day: number;
          price_per_week: number | null;
          deposit: number;
          features: string[];
          description: string | null;
          description_ar: string | null;
          description_fr: string | null;
          is_available: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          name_ar?: string | null;
          brand: string;
          model: string;
          year: number;
          category: CarCategory;
          transmission: TransmissionType;
          fuel_type: string;
          seats: number;
          doors: number;
          price_per_day: number;
          price_per_week?: number | null;
          deposit?: number;
          features?: string[];
          description?: string | null;
          description_ar?: string | null;
          description_fr?: string | null;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          name_ar?: string | null;
          brand?: string;
          model?: string;
          year?: number;
          category?: CarCategory;
          transmission?: TransmissionType;
          fuel_type?: string;
          seats?: number;
          doors?: number;
          price_per_day?: number;
          price_per_week?: number | null;
          deposit?: number;
          features?: string[];
          description?: string | null;
          description_ar?: string | null;
          description_fr?: string | null;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      car_images: {
        Row: {
          id: string;
          car_id: string;
          url: string;
          storage_path: string | null;
          alt: string | null;
          alt_ar: string | null;
          is_primary: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          car_id: string;
          url: string;
          storage_path?: string | null;
          alt?: string | null;
          alt_ar?: string | null;
          is_primary?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          car_id?: string;
          url?: string;
          storage_path?: string | null;
          alt?: string | null;
          alt_ar?: string | null;
          is_primary?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey";
            columns: ["car_id"];
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          car_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          period: string;
          start_date: string;
          end_date: string;
          total_days: number;
          pickup_location: string | null;
          dropoff_location: string | null;
          total_price: number;
          extras: Json;
          status: BookingStatus;
          notes: string | null;
          pdf_url: string | null;
          whatsapp_sent: boolean;
          reference: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          car_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          period: string;
          pickup_location?: string | null;
          dropoff_location?: string | null;
          total_price: number;
          extras?: Json;
          status?: BookingStatus;
          notes?: string | null;
          pdf_url?: string | null;
          whatsapp_sent?: boolean;
          reference?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          car_id?: string;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          period?: string;
          pickup_location?: string | null;
          dropoff_location?: string | null;
          total_price?: number;
          extras?: Json;
          status?: BookingStatus;
          notes?: string | null;
          pdf_url?: string | null;
          whatsapp_sent?: boolean;
          reference?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_car_id_fkey";
            columns: ["car_id"];
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
      blocked_periods: {
        Row: {
          id: string;
          car_id: string;
          period: string;
          reason: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          car_id: string;
          period: string;
          reason?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          car_id?: string;
          period?: string;
          reason?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocked_periods_car_id_fkey";
            columns: ["car_id"];
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      car_unavailable_ranges: {
        Row: {
          car_id: string | null;
          start_date: string | null;
          end_date: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_car_available: {
        Args: { car_id: string; p_start: string; p_end: string };
        Returns: boolean;
      };
    };
    Enums: {
      car_category: CarCategory;
      transmission_type: TransmissionType;
      booking_status: BookingStatus;
    };
    CompositeTypes: Record<never, never>;
  };
}

/* ── Convenience row aliases ──────────────────────────────────────── */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type AgencySettings = Tables<"agency_settings">;
export type Car = Tables<"cars">;
export type CarImage = Tables<"car_images">;
export type Booking = Tables<"bookings">;
export type BlockedPeriod = Tables<"blocked_periods">;
export type CarUnavailableRange =
  Database["public"]["Views"]["car_unavailable_ranges"]["Row"];
