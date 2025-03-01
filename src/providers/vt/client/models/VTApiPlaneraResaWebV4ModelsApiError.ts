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

import { exists, mapValues } from '../runtime';
/**
 * Information about the error.
 * @export
 * @interface VTApiPlaneraResaWebV4ModelsApiError
 */
export interface VTApiPlaneraResaWebV4ModelsApiError {
    /**
     * Error code.
     * @type {number}
     * @memberof VTApiPlaneraResaWebV4ModelsApiError
     */
    errorCode?: number;
    /**
     * More detailed description of the error.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsApiError
     */
    errorMessage?: string | null;
}

/**
 * Check if a given object implements the VTApiPlaneraResaWebV4ModelsApiError interface.
 */
export function instanceOfVTApiPlaneraResaWebV4ModelsApiError(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function VTApiPlaneraResaWebV4ModelsApiErrorFromJSON(json: any): VTApiPlaneraResaWebV4ModelsApiError {
    return VTApiPlaneraResaWebV4ModelsApiErrorFromJSONTyped(json, false);
}

export function VTApiPlaneraResaWebV4ModelsApiErrorFromJSONTyped(json: any, ignoreDiscriminator: boolean): VTApiPlaneraResaWebV4ModelsApiError {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'errorCode': !exists(json, 'errorCode') ? undefined : json['errorCode'],
        'errorMessage': !exists(json, 'errorMessage') ? undefined : json['errorMessage'],
    };
}

export function VTApiPlaneraResaWebV4ModelsApiErrorToJSON(value?: VTApiPlaneraResaWebV4ModelsApiError | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'errorCode': value.errorCode,
        'errorMessage': value.errorMessage,
    };
}

