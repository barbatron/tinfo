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
 * The different kinds of detailed information that could be included in a get journey details request.
 * @export
 */
export const VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeType = {
    Ticketsuggestions: 'ticketsuggestions',
    Triplegcoordinates: 'triplegcoordinates',
    Validzones: 'validzones',
    Servicejourneycalls: 'servicejourneycalls',
    Servicejourneycoordinates: 'servicejourneycoordinates',
    Links: 'links',
    Occupancy: 'occupancy'
} as const;
export type VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeType = typeof VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeType[keyof typeof VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeType];


export function VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeTypeFromJSON(json: any): VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeType {
    return VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeTypeFromJSONTyped(json, false);
}

export function VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeTypeFromJSONTyped(json: any, ignoreDiscriminator: boolean): VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeType {
    return json as VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeType;
}

export function VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeTypeToJSON(value?: VTApiPlaneraResaWebV4ModelsJourneyDetailsIncludeType | null): any {
    return value as any;
}

