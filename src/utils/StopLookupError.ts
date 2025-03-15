export class StopLookupError extends Error {
  public readonly matchingStops: ReadonlyArray<{ id: string; name: string }>;
  constructor(
    message: string,
    matchingStops: ReadonlyArray<{ id: string; name: string }> = [],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.matchingStops = matchingStops;
    this.name = "StopLookupError";
  }
}
