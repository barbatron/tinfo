import dayjs from "dayjs";
import { log } from "../../log.js";
import { Departure } from "../../types.js";
import { Sl } from "./types.js";
import { DepartureClient } from "../types.js";

export class SlTransportApiClient implements DepartureClient {
  public constructor(
    private readonly conf: {
      apiUrl: string;
      siteId: string;
      timeWindowMinutes: number;
    }
  ) {
    console.log(SlTransportApiClient.name, this.conf);
  }

  public async fetch(): Promise<Departure[]> {
    const url = new URL(this.conf.apiUrl.replace("{siteId}", this.conf.siteId));

    const response = await fetch(url);
    if (!response.ok) throw Error("Request failed: " + response.statusText);

    const data = (await response.json()) as Sl.TransportApi.DeparturesResponse;
    if (process.env.DEBUG)
      log.debug(
        data,
        "SL Transport API response",
        JSON.stringify(data, null, 2)
      );

    if (!data.departures) throw Error(JSON.stringify(data, null, 2));
    const departures = data.departures;

    const now = dayjs();
    const parsed: Departure[] = departures
      // Filter out non-metro departures
      .filter((d) => d.line.transport_mode === "METRO")
      // Filter out departures that are too far in the future
      .filter(
        (d) =>
          dayjs(d.expected).diff(now, "minutes") <= this.conf.timeWindowMinutes
      )
      .map((d) => ({
        expectedTime: new Date(d.expected ?? d.scheduled),
        scheduledTime: new Date(d.scheduled),
        displayTime: d.display,
        direction: String(d.direction_code),
        destination: d.destination,
      }));
    return parsed;
  }
}
