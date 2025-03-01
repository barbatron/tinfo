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
import type { VTApiPlaneraResaWebV4ModelsTransportMode } from './VTApiPlaneraResaWebV4ModelsTransportMode';
import {
    VTApiPlaneraResaWebV4ModelsTransportModeFromJSON,
    VTApiPlaneraResaWebV4ModelsTransportModeFromJSONTyped,
    VTApiPlaneraResaWebV4ModelsTransportModeToJSON,
} from './VTApiPlaneraResaWebV4ModelsTransportMode';
import type { VTApiPlaneraResaWebV4ModelsTransportSubMode } from './VTApiPlaneraResaWebV4ModelsTransportSubMode';
import {
    VTApiPlaneraResaWebV4ModelsTransportSubModeFromJSON,
    VTApiPlaneraResaWebV4ModelsTransportSubModeFromJSONTyped,
    VTApiPlaneraResaWebV4ModelsTransportSubModeToJSON,
} from './VTApiPlaneraResaWebV4ModelsTransportSubMode';

/**
 * Information about a line.
 * @export
 * @interface VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel
 */
export interface VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel {
    /**
     * The line name.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel
     */
    name?: string | null;
    /**
     * The Product Line name.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel
     */
    detailName?: string | null;
    /**
     * The background color of the line symbol.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel
     */
    backgroundColor?: string | null;
    /**
     * The foreground color of the line symbol.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel
     */
    foregroundColor?: string | null;
    /**
     * The border color of the line symbol.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel
     */
    borderColor?: string | null;
    /**
     * 
     * @type {VTApiPlaneraResaWebV4ModelsTransportMode}
     * @memberof VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel
     */
    transportMode?: VTApiPlaneraResaWebV4ModelsTransportMode;
    /**
     * 
     * @type {VTApiPlaneraResaWebV4ModelsTransportSubMode}
     * @memberof VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel
     */
    transportSubMode?: VTApiPlaneraResaWebV4ModelsTransportSubMode;
}

/**
 * Check if a given object implements the VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel interface.
 */
export function instanceOfVTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModelFromJSON(json: any): VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel {
    return VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModelFromJSONTyped(json, false);
}

export function VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': !exists(json, 'name') ? undefined : json['name'],
        'detailName': !exists(json, 'detailName') ? undefined : json['detailName'],
        'backgroundColor': !exists(json, 'backgroundColor') ? undefined : json['backgroundColor'],
        'foregroundColor': !exists(json, 'foregroundColor') ? undefined : json['foregroundColor'],
        'borderColor': !exists(json, 'borderColor') ? undefined : json['borderColor'],
        'transportMode': !exists(json, 'transportMode') ? undefined : VTApiPlaneraResaWebV4ModelsTransportModeFromJSON(json['transportMode']),
        'transportSubMode': !exists(json, 'transportSubMode') ? undefined : VTApiPlaneraResaWebV4ModelsTransportSubModeFromJSON(json['transportSubMode']),
    };
}

export function VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModelToJSON(value?: VTApiPlaneraResaWebV4ModelsPositionsLineDetailsApiModel | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'detailName': value.detailName,
        'backgroundColor': value.backgroundColor,
        'foregroundColor': value.foregroundColor,
        'borderColor': value.borderColor,
        'transportMode': VTApiPlaneraResaWebV4ModelsTransportModeToJSON(value.transportMode),
        'transportSubMode': VTApiPlaneraResaWebV4ModelsTransportSubModeToJSON(value.transportSubMode),
    };
}

