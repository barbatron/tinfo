export interface DepartureClient {
  public fetch(params?: Partial<RenderParams>): Promise<Departure[]>;
}
