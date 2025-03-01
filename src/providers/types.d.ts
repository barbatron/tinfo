export interface DepartureClient {
  public fetch(): Promise<Departure[]>;
}
