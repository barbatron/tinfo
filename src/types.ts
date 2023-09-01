export interface Departure {
  scheduledTime: Date;
  expectedTime: Date;
  destination: string;
  direction?: string;
}

export interface DepartureExt extends Departure {
  successProbPow: number;
  successProb: number;
  expectedInSeconds: number;
  scheduleDriftSeconds: number;
}
