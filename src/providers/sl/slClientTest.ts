import { log } from "../../log";
import { Departure } from "../../types";

type DepartureNew = {
  destination: string;
  stopAreaName: string;
  journeyNumber: string;
  time: {
    timeTabledDateTime: string;
    expectedDateTime: string;
    displayTime: string;
  };
  transport: {
    destination: string;
    line: string;
    direction: number;
    transportType: "BUS" | "METRO";
    transportSubType: string;
  };
};

export class SlClientTest {
  public constructor(
    private readonly conf: {
      apiUrl: string;
      apiKey: string;
      siteId: string;
      timeWindowMinutes: number;
      direction?: string;
    }
  ) {
    console.log(SlClientTest.name, this.conf);
  }

  public async fetch(): Promise<Departure[]> {
    const url = new URL("https://services.c.web.sl.se/api/v2/departures");
    url.searchParams.set("origSiteId", this.conf.siteId);
    // url.searchParams.set("TimeWindow", String(this.conf.timeWindowMinutes));
    // url.searchParams.set("Bus", "false");

    const response = await fetch(url);
    if (!response.ok) throw Error("Request failed: " + response.statusText);

    const data = (await response.json()) as any;
    log.info(data, "SL Departures API respponse", data);

    if (data.Message) throw Error(data.Message);

    const departures = data as DepartureNew[];

    const parsed: Departure[] = departures
      .filter((d) => d.transport.transportType === "METRO")
      .map((d) => ({
        expectedTime: new Date(
          d.time.expectedDateTime ?? d.time.timeTabledDateTime
        ),
        scheduledTime: new Date(d.time.timeTabledDateTime),
        displayTime: d.time.displayTime,
        direction: String(d.transport.direction), // TODO: type
        destination: d.destination,
      }));

    return parsed;
  }
}
