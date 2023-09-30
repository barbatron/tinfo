import fetch from "node-fetch";
import { getConfig } from "../config.ts";
import { log } from "../log.ts";
import { Departure } from "../types.ts";

const SL_REALTIME_DEPARTURES_API_URL =
  "https://api.sl.se/api2/realtimedeparturesV4.json";

class SlRealtimeClient {
  public constructor(
    private readonly conf: {
      apiKey: string;
      siteId: string;
      timeWindowMinutes: number;
      direction?: string;
    }
  ) {}

  public async fetch() {
    const url = new URL(SL_REALTIME_DEPARTURES_API_URL);
    url.searchParams.set("Key", this.conf.apiKey);
    url.searchParams.set("SiteId", this.conf.siteId);
    url.searchParams.set("TimeWindow", String(this.conf.timeWindowMinutes));
    // url.searchParams.set("Bus", "false");

    const response = await fetch(url);
    if (!response.ok) throw Error("Request failed");

    const data = (await response.json()) as any;
    log.info(data, "fetch respponse", data);

    if (data.Message) throw Error(data.Message);

    // TODO: un-metro
    const departures = data.ResponseData.Metros as any[];

    const parsed: Departure[] = departures.map((d) => ({
      expectedTime: d.ExpectedDateTime ?? d.TimeTabledDateTime,
      scheduledTime: d.TimeTabledDateTime,
      direction: d.JourneyDirection, // TODO: type
      destination: d.Destination,
    }));

    return parsed;
  }
}

export function createSlRealtimeClient() {
  const REALTIME_API_KEY = getConfig<string>("SL_REALTIME_API_KEY");
  const SITE_ID = getConfig<string>("SL_SITE_ID");
  const JOURNEY_DIRECTION = getConfig<string>("SL_JOURNEY_DIRECTION", false);
  const TIME_WINDOW_MINUTES =
    getConfig<number>("TIME_WINDOW_MINUTES", false) ?? 30;

  return new SlRealtimeClient({
    apiKey: REALTIME_API_KEY,
    siteId: SITE_ID,
    direction: JOURNEY_DIRECTION,
    timeWindowMinutes: TIME_WINDOW_MINUTES,
  });
}
