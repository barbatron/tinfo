import { Departure } from "../../types";
import { DepartureClient } from "../types";
import {
  Configuration,
  StopAreasApi,
  VTApiPlaneraResaCoreModelsPositionTransportMode,
  VTApiPlaneraResaWebV4ModelsDeparturesAndArrivalsGetDeparturesResponse,
} from "./client";
import { Vt } from "./types";
import { StopAreasStopAreaGidDeparturesGetRequest } from "./client/apis/StopAreasApi";

export class VtPlaneraResaApiClient implements DepartureClient {
  private readonly stopAreasClient: StopAreasApi;

  public constructor(
    private readonly conf: Readonly<Vt.PlaneraResaApi.Config>
  ) {
    const stopAreasApiConfig = new Configuration({
      apiKey: this.conf.appConfig.clientAuthKey,
    });
    this.stopAreasClient = new StopAreasApi(stopAreasApiConfig);
  }

  public async fetch(): Promise<Departure[]> {
    const req: StopAreasStopAreaGidDeparturesGetRequest = {
      stopAreaGid: this.conf.stopAreaGid,
      timeSpanInMinutes: this.conf.timeWindowMinutes,
    };
    const response: VTApiPlaneraResaWebV4ModelsDeparturesAndArrivalsGetDeparturesResponse =
      await this.stopAreasClient.stopAreasStopAreaGidDeparturesGet(req);
    if (!response.results)
      throw Error(
        `No results in response:\n${JSON.stringify(response, null, 2)}`
      );

    return response.results
      .filter(
        (r) =>
          !!r.serviceJourney?.line &&
          r.serviceJourney.line?.transportMode ==
            VTApiPlaneraResaCoreModelsPositionTransportMode.Tram
      )
      .map((r) => {
        if (!r.serviceJourney?.line)
          throw Error("We filtered this - catch up, typescript");
        return {
          expectedTime: new Date(
            r.estimatedTime ?? r.estimatedOtherwisePlannedTime ?? r.plannedTime
          ),
          scheduledTime: new Date(r.plannedTime),
          // displayTime: r.,
          direction: r.serviceJourney.direction ?? "Unknown",
          destination: r.serviceJourney.direction ?? "Unknown",
        };
      });
  }
}
