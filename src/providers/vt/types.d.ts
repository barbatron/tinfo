export declare namespace Vt {
  export declare namespace PlaneraResaApi {
    export type AppConfig = {
      clientId: string;
      clientSecret: string;
      clientAuthKey: string;
    };

    export type Config = {
      appConfig: AppConfig;
      stopAreaGid: string;
      timeWindowMinutes: number;
      direction?: string;
    };
  }
}
