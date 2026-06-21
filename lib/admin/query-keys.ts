/** Shared TanStack Query keys for the admin dashboard. */
export const adminKeys = {
  cars: ["admin", "cars"] as const,
  bookings: ["admin", "bookings"] as const,
  images: (carId: string) => ["admin", "images", carId] as const,
  blocks: (carId: string) => ["admin", "blocks", carId] as const,
  unavailable: (carId: string) => ["admin", "unavailable", carId] as const,
};
