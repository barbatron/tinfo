import { Config, MIN_TIME_MINUTES } from "../../config"
import { Vt } from "./types"
import { VtAuthClient } from "./vtAuthClient"
import { VtPlaneraResaApiClient } from "./vtPlaneraResaApiClient"
import { VtPlaneraResaStopAreaClient } from "./vtPlaneraResaStopAreaClient"
import { StopAreasApi } from "./client/apis/StopAreasApi"
import { Configuration, Middleware, RequestContext } from "./client"
import { DepartureClient } from "../../types"

const deviceId = `device_jold_${Date.now()}`

const logMiddleware: Middleware = {
  pre: async (fetchAndInit: RequestContext) => {
    const { ...init } = fetchAndInit
    console.debug("[vt-pre] init", init)
  },
}

export function createVtClient(config: Config): DepartureClient {
  const oauthAppConfig: Vt.PlaneraResaApi.OauthAppConfig = {
    clientAuthKey: config.getString("VT_CLIENT_AUTH_KEY", true)!,
  }
  const authClient = new VtAuthClient({ oauthAppConfig, scope: deviceId })
  const authTokenAccessor = () =>
    authClient.getToken().then((t) => `${t.token_type} ${t.access_token}`)

  const apiConfiguration = new Configuration({
    accessToken: authTokenAccessor,
    ...(!!config.getString("TRACE", false) && { middleware: [logMiddleware] }),
  })

  const stopAreaClient = new VtPlaneraResaStopAreaClient({
    api: new StopAreasApi(apiConfiguration),
  })
  const stopAreasApi = new StopAreasApi(apiConfiguration)

  return new VtPlaneraResaApiClient({
    api: stopAreasApi,
    stopAreaClient,
  })
}
