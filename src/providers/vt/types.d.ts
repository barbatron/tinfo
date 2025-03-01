export declare namespace Vt {
  export declare namespace PlaneraResaApi {
    /* Auth */

    export type OauthAppConfig = {
      clientId: string;
      clientSecret: string;
    } | { clientAuthKey: string };

    export interface OauthResponse {
      access_token: string;
      scope: string;
      token_type: string;
      expires_in: number;
    }

    export interface OauthClient {
      getToken(): Promise<OauthResponse>;
    }

    /* Client */

    export type ClientConfig = {
      authClient: OauthClient;
      stopAreaGid: string;
      timeWindowMinutes: number;
      direction?: string;
    };
  }
}
