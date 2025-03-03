import { log } from "../../log";
import { Departure, FetchParams } from "../../types";
import { DepartureClient } from "../types";
import {
  StopAreasApi,
  VTApiPlaneraResaCoreModelsPositionTransportMode,
  VTApiPlaneraResaWebV4ModelsDeparturesAndArrivalsGetDeparturesResponse,
} from "./client";
import { StopAreasStopAreaGidDeparturesGetRequest } from "./client/apis/StopAreasApi";
import { Vt } from "./types";

type Config = {
  stopAreaClient: Vt.PlaneraResaApi.StopAreaClient;
  api: StopAreasApi;
  stopAreaGid: string;
  timeWindowMinutes: number;
  direction?: string;
};

export class VtPlaneraResaApiClient implements DepartureClient {
  public constructor(private readonly conf: Readonly<Config>) {}

  public async fetch(params?: Partial<FetchParams>): Promise<Departure[]> {
    const locationString = params?.stop_id ?? this.conf.stopAreaGid;
    const { gid: stopAreaGid } = await this.conf.stopAreaClient.lookup(
      locationString
    );
    const req: StopAreasStopAreaGidDeparturesGetRequest = {
      stopAreaGid,
      timeSpanInMinutes: this.conf.timeWindowMinutes,
    };

    log.debug("[vt] Requesting departures", req);
    const response: VTApiPlaneraResaWebV4ModelsDeparturesAndArrivalsGetDeparturesResponse =
      await this.conf.api.stopAreasStopAreaGidDeparturesGet(req);
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
          throw Error("No line in response");
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
