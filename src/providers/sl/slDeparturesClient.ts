import { log } from "../../log";
import { Departure } from "../../types";

export class SlRealtimeClient {
  public constructor(
    private readonly conf: {
      apiUrl: string;
      apiKey: string;
      siteId: string;
      timeWindowMinutes: number;
      direction?: string;
    }
  ) {
    console.log(SlRealtimeClient.name, this.conf);
  }

  public async fetch() {
    const url = new URL(this.conf.apiUrl);
    url.searchParams.set("Key", this.conf.apiKey);
    url.searchParams.set("SiteId", this.conf.siteId);
    url.searchParams.set("TimeWindow", String(this.conf.timeWindowMinutes));
    url.searchParams.set("Bus", "false");

    const response = await fetch(url);
    if (!response.ok) throw Error("Request failed: " + response.statusText);

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
