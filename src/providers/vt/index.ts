import { Config } from "../../config";
import { DepartureClient } from "../types";
import { Vt } from "./types";
import { VtAuthClient } from "./vtAuthClient";
import { VtPlaneraResaApiClient } from "./vtPlaneraResaApiClient";

const deviceId = `device_jold_${Date.now()}`;

export function createVtClient(config: Config): DepartureClient {
  const oauthAppConfig: Vt.PlaneraResaApi.OauthAppConfig = {
    // clientId: config.getString("VT_CLIENT_ID", true)!,
    // clientSecret: config.getString("VT_CLIENT_SECRET", true)!,
    clientAuthKey: config.getString("VT_CLIENT_AUTH_KEY", true)!,
  };
  const authClient = new VtAuthClient({ oauthAppConfig, scope: deviceId });
  const vtConfig: Vt.PlaneraResaApi.ClientConfig = {
    authClient,
    stopAreaGid: config.getString("VT_STOP_AREA_GID", true)!,
    timeWindowMinutes: config.getNumber("TIME_WINDOW_MINUTES", false) ?? 30,
  };
  return new VtPlaneraResaApiClient(vtConfig);
}
