import { log } from "../../log";
import { Departure } from "../../types";
import { DepartureClient } from "../types";
import {
  Configuration,
  Middleware,
  RequestContext,
  StopAreasApi,
  VTApiPlaneraResaCoreModelsPositionTransportMode,
  VTApiPlaneraResaWebV4ModelsDeparturesAndArrivalsGetDeparturesResponse,
} from "./client";
import { StopAreasStopAreaGidDeparturesGetRequest } from "./client/apis/StopAreasApi";
import { Vt } from "./types";

const logMiddleware: Middleware = {
  pre: async (fetchAndInit: RequestContext) => {
    const { ...init } = fetchAndInit;
    console.debug("[vt-pre] init", init);
  },
};

export function createStopAreasApi(
  conf: Readonly<Vt.PlaneraResaApi.ClientConfig>
): StopAreasApi {
  const authTokenAccessor = () =>
    conf.authClient.getToken().then((t) => `${t.token_type} ${t.access_token}`);
  const stopAreasApiConfig = new Configuration({
    accessToken: authTokenAccessor,
    // middleware: [logMiddleware],
  });
  const stopAreasApi = new StopAreasApi(stopAreasApiConfig);
  return stopAreasApi;
}

export class VtPlaneraResaApiClient implements DepartureClient {
  private readonly stopAreasClient: StopAreasApi;

  public constructor(
    private readonly conf: Readonly<Vt.PlaneraResaApi.ClientConfig>
  ) {
    this.stopAreasClient = createStopAreasApi(conf);
  }

  public async fetch(): Promise<Departure[]> {
    const req: StopAreasStopAreaGidDeparturesGetRequest = {
      stopAreaGid: this.conf.stopAreaGid,
      timeSpanInMinutes: this.conf.timeWindowMinutes,
    };
    log.debug("[vt] Requesting departures", req);
    const response: VTApiPlaneraResaWebV4ModelsDeparturesAndArrivalsGetDeparturesResponse =
      await this.stopAreasClient.stopAreasStopAreaGidDeparturesGet(req);
    if (!response.results) {
      throw Error(
        `No results in response:\n${JSON.stringify(response, null, 2)}`
      );
    }

    return response.results
      .filter(
        (r) =>
          !!r.serviceJourney?.line &&
          r.serviceJourney.line?.transportMode ==
            VTApiPlaneraResaCoreModelsPositionTransportMode.Tram
      )
      .map((r) => {
        if (!r.serviceJourney?.line) {
          throw Error("We filtered this - catch up, typescript");
        }
        return {
          expectedTime: new Date(
            r.estimatedTime ?? r.estimatedOtherwisePlannedTime ?? r.plannedTime
          ),
          scheduledTime: new Date(r.plannedTime),
          direction: undefined,
          // displayTime: r.,
          // direction: r.serviceJourney.direction ?? "Unknown",
          destination: r.serviceJourney.direction ?? "Unknown",
          mot: r.serviceJourney.line.transportMode,
        };
      });
  }
}
