import { Config } from "../../config";
import { DepartureClient } from "../types";
import { Vt } from "./types";
import { VtPlaneraResaApiClient } from "./vtPlaneraResaApiClient";

export function createVtClient(config: Config): DepartureClient {
  const appConfig: Vt.PlaneraResaApi.AppConfig = {
    clientId: config.getString("VT_CLIENT_ID", true)!,
    clientSecret: config.getString("VT_CLIENT_SECRET", true)!,
    clientAuthKey: config.getString("VT_CLIENT_AUTH_KEY", true)!,
  };
  const vtConfig: Vt.PlaneraResaApi.Config = {
    appConfig,
    stopAreaGid: config.getString("VT_STOP_AREA_GID", true)!,
  };
  return new VtPlaneraResaApiClient(vtConfig);
}
