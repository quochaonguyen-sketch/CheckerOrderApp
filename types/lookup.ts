export type OrderLocation = {
  code: string;
  zone: string;
  district: string;
  ward: string;
  city: string;
  area: string;
  note: string;
};

export type LookupFoundResponse = {
  found: true;
  data: OrderLocation;
};

export type LookupNotFoundResponse = {
  found: false;
  message: string;
};

export type LookupResponse = LookupFoundResponse | LookupNotFoundResponse;

export type LookupErrorResponse = {
  error: string;
};

export type ScanStatus = "idle" | "loading" | "found" | "not-found" | "error";
