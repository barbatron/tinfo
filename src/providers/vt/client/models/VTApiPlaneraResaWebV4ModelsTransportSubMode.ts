/* tslint:disable */
/* eslint-disable */
/**
 * Planera Resa
 * Sök och planera resor med Västtrafik
 *
 * The version of the OpenAPI document: v4
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


/**
 * Represents the different types of sub transport modes.
 * @export
 */
export const VTApiPlaneraResaWebV4ModelsTransportSubMode = {
    Unknown: 'unknown',
    None: 'none',
    Vasttagen: 'vasttagen',
    Longdistancetrain: 'longdistancetrain',
    Regionaltrain: 'regionaltrain',
    Flygbussarna: 'flygbussarna'
} as const;
export type VTApiPlaneraResaWebV4ModelsTransportSubMode = typeof VTApiPlaneraResaWebV4ModelsTransportSubMode[keyof typeof VTApiPlaneraResaWebV4ModelsTransportSubMode];


export function VTApiPlaneraResaWebV4ModelsTransportSubModeFromJSON(json: any): VTApiPlaneraResaWebV4ModelsTransportSubMode {
    return VTApiPlaneraResaWebV4ModelsTransportSubModeFromJSONTyped(json, false);
}

export function VTApiPlaneraResaWebV4ModelsTransportSubModeFromJSONTyped(json: any, ignoreDiscriminator: boolean): VTApiPlaneraResaWebV4ModelsTransportSubMode {
    return json as VTApiPlaneraResaWebV4ModelsTransportSubMode;
}

export function VTApiPlaneraResaWebV4ModelsTransportSubModeToJSON(value?: VTApiPlaneraResaWebV4ModelsTransportSubMode | null): any {
    return value as any;
}

