/** Serializable car summary passed from the Server Component to the client
 * booking form (only the fields the flow needs — no PII, no raw row). */
export interface BookingCar {
  id: string;
  slug: string;
  /** Already localized for the active locale. */
  name: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  pricePerWeek: number | null;
  pricePer15Days: number | null;
  pricePerMonth: number | null;
  deposit: number;
  /** Agency currency (from `agency_settings`, falling back to site config). */
  currency: string;
  image: { url: string; alt: string } | null;
}
