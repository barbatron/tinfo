import { Config, getConfig } from "../../config";
import { SlClientTest } from "./slClientTest";
import { SlRealtimeClient } from "./slDeparturesClient";

const SL_REALTIME_DEPARTURES_API_URL =
  "https://api.sl.se/api2/realtimedeparturesV4.json";

export function createSlRealtimeClient(config: Config) {
  const REALTIME_API_KEY = config.getString("SL_REALTIME_API_KEY", true)!;
  const SITE_ID = config.getString("SL_SITE_ID", true)!;
  const JOURNEY_DIRECTION = config.getString("SL_JOURNEY_DIRECTION", true)!;
  const TIME_WINDOW_MINUTES =
    config.getNumber("TIME_WINDOW_MINUTES", false) ?? 30;

  return new SlRealtimeClient({
    apiUrl: SL_REALTIME_DEPARTURES_API_URL,
    apiKey: REALTIME_API_KEY,
    siteId: SITE_ID,
    direction: JOURNEY_DIRECTION,
    timeWindowMinutes: TIME_WINDOW_MINUTES,
  });
}

export function createSlClientTest(config: Config) {
  const REALTIME_API_KEY = config.getString("SL_REALTIME_API_KEY", true)!;
  const SITE_ID = config.getString("SL_SITE_ID", true)!;
  const JOURNEY_DIRECTION = config.getString("SL_JOURNEY_DIRECTION", true)!;
  const TIME_WINDOW_MINUTES =
    config.getNumber("TIME_WINDOW_MINUTES", false) ?? 30;

  return new SlClientTest({
    apiUrl: SL_REALTIME_DEPARTURES_API_URL,
    apiKey: REALTIME_API_KEY,
    siteId: SITE_ID,
    direction: JOURNEY_DIRECTION,
    timeWindowMinutes: TIME_WINDOW_MINUTES,
  });
}
