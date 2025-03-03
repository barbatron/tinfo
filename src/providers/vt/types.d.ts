export declare namespace Vt {
  export declare namespace PlaneraResaApi {
    /* Auth */

    export type OauthAppConfig =
      | {
          clientId: string;
          clientSecret: string;
        }
      | { clientAuthKey: string };

    export interface OauthResponse {
      access_token: string;
      scope: string;
      token_type: string;
      expires_in: number;
    }

    export interface OauthClient {
      getToken(): Promise<OauthResponse>;
    }

    /* StopArea */
    export interface Location {
      gid: string;
      name: string;
      locationType: string;
      latitude: number;
      longitude: number;
      platform: string;
      straightLineDistanceInMeters: number;
      hasLocalService: true;
    }

    export interface LocationResponse {
      results: Location[];
      pagination: {
        limit: number;
        offset: number;
        size: number;
      };
      links: {
        previous: string;
        next: string;
        current: string;
      };
    }

    export interface StopArea {
      id: string;
      name: string;
      type: string;
      lon: number;
      lat: number;
      idx: number;
    }

    /* Client */
    export interface StopAreaClient {
      lookup(name: string): Promise<{ gid: string }>;
    }
  }
}
