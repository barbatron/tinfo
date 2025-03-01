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
 * Different types of unit that specifies the amount of the Amount property.
 * @export
 */
export const VTApiPlaneraResaWebV4ModelsTimeValidityUnit = {
    Unknown: 'unknown',
    Minutes: 'minutes',
    Hours: 'hours',
    Days: 'days',
    Year: 'year',
    Semester: 'semester',
    Schoolyear: 'schoolyear',
    Unlimited: 'unlimited'
} as const;
export type VTApiPlaneraResaWebV4ModelsTimeValidityUnit = typeof VTApiPlaneraResaWebV4ModelsTimeValidityUnit[keyof typeof VTApiPlaneraResaWebV4ModelsTimeValidityUnit];


export function VTApiPlaneraResaWebV4ModelsTimeValidityUnitFromJSON(json: any): VTApiPlaneraResaWebV4ModelsTimeValidityUnit {
    return VTApiPlaneraResaWebV4ModelsTimeValidityUnitFromJSONTyped(json, false);
}

export function VTApiPlaneraResaWebV4ModelsTimeValidityUnitFromJSONTyped(json: any, ignoreDiscriminator: boolean): VTApiPlaneraResaWebV4ModelsTimeValidityUnit {
    return json as VTApiPlaneraResaWebV4ModelsTimeValidityUnit;
}

export function VTApiPlaneraResaWebV4ModelsTimeValidityUnitToJSON(value?: VTApiPlaneraResaWebV4ModelsTimeValidityUnit | null): any {
    return value as any;
}

