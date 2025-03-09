export interface Departure {
  scheduledTime: Date;
  expectedTime: Date;
  displayTime?: string;
  destination: string;
  direction?: string;
  mot?: string;
}

export interface DepartureExt extends Departure {
  successProbPow: number;
  successProb: number;
  expectedInSeconds: number;
  scheduleDriftSeconds: number;
}

export type FetchParams = {
  // SL site ID or VT stop area GID
  stop_id: string;
  // Direction - provider-dependent
  dir?: string | undefined;
  // Preferred mode of transport
  mot?: string | undefined;
  // Minimum time until departure, in minutes
  min_min?: number | undefined;
  // Minimum time until departure, in minutes
  max_min?: number | undefined;
  // Max number of departures
  limit?: number | undefined;
};

export interface DepartureClient {
  fetch(params: FetchParams): Promise<Departure[]>;
}
