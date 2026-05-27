export type ActionResponse<T = unknown> = {
  success: true;
  data?: T;
} | {
  error: string;
  success?: false;
};

export type ParkingResponse = ActionResponse<{
  id: string;
  name: string;
  address: string;
}>;

export type VehicleEntryResponse = ActionResponse<{
  isSubscriber: boolean;
}>;

export type VehicleExitResponse = ActionResponse<{
  cost: number;
  receiptNumber?: string;
}>;

export type CostResponse = {
  cost: number;
  durationMinutes: number;
  isSubscriber: boolean;
  entryTime?: Date;
  billingMode?: string;
} | null;

export type AuthResponse = ActionResponse;

export type SubscriberResponse = ActionResponse;

export type WorkerResponse = ActionResponse;

export type PricingResponse = ActionResponse;
