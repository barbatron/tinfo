import fetch from "node-fetch";
import { log } from "../../log.ts";
import { Departure } from "../../types.ts";

export class SlRealtimeClient {
  public constructor(
    private readonly conf: {
      apiUrl: string;
      apiKey: string;
      siteId: string;
      timeWindowMinutes: number;
      direction?: string;
    }
  ) {}

  public async fetch() {
    const url = new URL(this.conf.apiUrl);
    url.searchParams.set("Key", this.conf.apiKey);
    url.searchParams.set("SiteId", this.conf.siteId);
    url.searchParams.set("TimeWindow", String(this.conf.timeWindowMinutes));
    url.searchParams.set("Bus", "false");

    const response = await fetch(url);
    if (!response.ok) throw Error("Request failed");

    const data = (await response.json()) as any;
    log.info(data, "SL Departures API respponse", data);

    if (data.Message) throw Error(data.Message);

    // TODO: un-metro
    const departures = data.ResponseData.Metros as any[];

    const parsed: Departure[] = departures.map((d) => ({
      expectedTime: d.ExpectedDateTime ?? d.TimeTabledDateTime,
      scheduledTime: d.TimeTabledDateTime,
      direction: String(d.JourneyDirection), // TODO: type
      destination: d.Destination,
    }));

    return parsed;
  }
}
