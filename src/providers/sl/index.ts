import { Config } from "../../config";
import { DepartureClient } from "../types";
import { SlTransportApiClient } from "./slTransportApiClient";

const SL_TRANSPORT_DEPARTURES_API_URL =
  "https://transport.integration.sl.se/v1/sites/{siteId}/departures";

export function createSlTransportApiClient(config: Config): DepartureClient {
  const SITE_ID = config.getString("SL_SITE_ID", true)!;
  const JOURNEY_DIRECTION = config.getString("SL_JOURNEY_DIRECTION", true)!;
  const TIME_WINDOW_MINUTES =
    config.getNumber("TIME_WINDOW_MINUTES", false) ?? 30;

  return new SlTransportApiClient({
    apiUrl: SL_TRANSPORT_DEPARTURES_API_URL,
    siteId: SITE_ID,
    direction: JOURNEY_DIRECTION,
    timeWindowMinutes: TIME_WINDOW_MINUTES,
  });
}
