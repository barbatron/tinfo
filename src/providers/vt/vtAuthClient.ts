import { log } from "../../log";
import { Vt } from "./types";

type AuthClientConf = {
  oauthAppConfig: Readonly<Vt.PlaneraResaApi.OauthAppConfig>;
  scope?: string;
};

const TOKEN_URL = "https://ext-api.vasttrafik.se/token";

export class VtAuthClient implements Vt.PlaneraResaApi.OauthClient {
  private latestAuth?: Vt.PlaneraResaApi.OauthResponse;
  private refreshTokenTimeout?: NodeJS.Timer;

  public constructor(private readonly conf: Readonly<AuthClientConf>) {}

  public async getToken(): Promise<Vt.PlaneraResaApi.OauthResponse> {
    if (this.latestAuth) {
      return this.latestAuth;
    }
    const basicAuthB64 =
      "clientAuthKey" in this.conf.oauthAppConfig
        ? this.conf.oauthAppConfig.clientAuthKey
        : btoa(
            `${this.conf.oauthAppConfig.clientId}:${this.conf.oauthAppConfig.clientSecret}`,
          );

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      body: `grant_type=client_credentials${
        this.conf.scope ? `&scope=this.conf.scope}` : ""
      }`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuthB64}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }

    const authResponse =
      (await response.json()) as Vt.PlaneraResaApi.OauthResponse;

    this.latestAuth = authResponse;

    if (authResponse.expires_in) {
      if (this.refreshTokenTimeout) clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = setTimeout(() => {
        log.debug("[vt] Token expired");
        this.latestAuth = undefined;
      }, authResponse.expires_in * 1000);
      log.debug("[vt] Scheduled expiry in:", authResponse.expires_in);
    }
    return authResponse;
  }
}
