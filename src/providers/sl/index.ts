import { Config } from "../../config"
import { DepartureClient } from "../../types"
import { SlTransportApiClient } from "./slTransportApiClient"
import { SlTransportSiteClient } from "./slTransportSiteClient"

const SL_TRANSPORT_DEPARTURES_API_URL =
  "https://transport.integration.sl.se/v1/sites/{siteId}/departures"

export function createSlTransportApiClient(config: Config): DepartureClient {
  const apiUrl =
    config.getString("SL_TRANSPORT_DEPARTURES_API_URL", false) ||
    SL_TRANSPORT_DEPARTURES_API_URL
  const siteClient = new SlTransportSiteClient()
  return new SlTransportApiClient({
    apiUrl,
    siteClient,
  })
}
