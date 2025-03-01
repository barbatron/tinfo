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

export type FetchParams = Readonly<{
  stop_id: string;
  dir: string;
  mot: string;
}>;
