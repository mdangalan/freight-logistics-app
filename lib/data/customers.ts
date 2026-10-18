import customersJson from "@/data/dummy/customers.json";

export type SampleContact = {
  name: string;
  email: string;
};

export type SampleBooking = {
  id: string;
  date: string;
  status: "confirmed" | "cancelled";
  pickupAddress: string;
  deliveryAddress: string;
  goodsDescription: string;
  palletCount: number;
  totalWeightKg: number;
};

export type SampleCustomer = {
  id: string;
  name: string;
  contacts: SampleContact[];
  bookings: SampleBooking[];
};

export const SAMPLE_CUSTOMERS = customersJson as SampleCustomer[];

export function sampleCustomersJson(): string {
  return JSON.stringify(SAMPLE_CUSTOMERS, null, 2);
}
