import { log } from "../../log.js"
import { Departure, DepartureClient, FetchParams } from "../../types.js"
import { Sl } from "./types.js"
import { SlTransportSiteClient } from "./slTransportSiteClient.js"

type Config = {
  apiUrl: string
  siteClient: SlTransportSiteClient
}

export class SlTransportApiClient implements DepartureClient {
  public constructor(private readonly conf: Readonly<Config>) {
    console.log(SlTransportApiClient.name, this.conf)
  }

  public async fetch({ stop_id }: FetchParams): Promise<Departure[]> {
    const { id: siteId } = await this.conf.siteClient.lookup(stop_id)

    const url = new URL(this.conf.apiUrl.replace("{siteId}", siteId))

    const response = await fetch(url)
    if (!response.ok) {
      throw Error(
        "Request failed: " +
          response.statusText +
          "\n" +
          JSON.stringify(
            { url: response.url, responseHeaders: response.headers },
            null,
            2
          )
      )
    }

    const data = (await response.json()) as Sl.TransportApi.DeparturesResponse
    if (process.env.TRACE) {
      log.debug(
        data,
        "SL Transport API response",
        JSON.stringify(data, null, 2)
      )
    }

    if (!data.departures) throw Error(JSON.stringify(data, null, 2))
    const departures = data.departures

    const parsed: Departure[] = departures.map((d) => ({
      expectedTime: new Date(d.expected ?? d.scheduled),
      scheduledTime: new Date(d.scheduled),
      displayTime: d.display,
      direction: String(d.direction_code),
      destination: d.destination,
      mot: d.line.transport_mode,
    }))
    return parsed
  }
}
