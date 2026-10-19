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

const SAMPLE_CUSTOMERS_JSON = JSON.stringify(SAMPLE_CUSTOMERS, null, 2);

export function sampleCustomersJson(): string {
  return SAMPLE_CUSTOMERS_JSON;
}
