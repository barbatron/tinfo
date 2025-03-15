import { log } from "../log";
import { Departure, FetchParams, Provider } from "../types";

const TTL_MS = 30 * 1000;

export type DeparturesLookup = {
  providerName: Provider;
  params: FetchParams;
};

export type DeparturesLookupResult = {
  departures: ReadonlyArray<Readonly<Departure>>;
  timestamp: Date;
  expirationTimer: Timer;
};

const departuresCache = new Map<
  string,
  DeparturesLookupResult
>();

export function get(
  providerName: Provider,
  params: FetchParams,
): DeparturesLookupResult | undefined {
  const key = JSON.stringify({ providerName, params });
  return departuresCache.get(key);
}

export function put(
  providerName: Provider,
  params: FetchParams,
  departures: ReadonlyArray<Readonly<Departure>>,
) {
  const key = JSON.stringify({ providerName, params });
  const existing = departuresCache.get(key);
  if (existing) {
    clearTimeout(existing.expirationTimer);
  }
  departuresCache.set(key, {
    departures,
    timestamp: new Date(),
    expirationTimer: setTimeout(
      () => {
        departuresCache.delete(key), log.debug("Cache expiration", key);
      },
      TTL_MS,
    ),
  });
  log.debug("Cache updated", key);
  return departures;
}
