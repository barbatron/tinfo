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
 * @interface VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
 */
export interface VTApiPlaneraResaWebV4ModelsJourneysLineApiModel {
    /**
     * The line name.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
     */
    name?: string | null;
    /**
     * The Product Line name.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
     */
    detailName?: string | null;
    /**
     * The background color of the line symbol.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
     */
    backgroundColor?: string | null;
    /**
     * The foreground color of the line symbol.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
     */
    foregroundColor?: string | null;
    /**
     * The border color of the line symbol.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
     */
    borderColor?: string | null;
    /**
     * 
     * @type {VTApiPlaneraResaWebV4ModelsTransportMode}
     * @memberof VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
     */
    transportMode?: VTApiPlaneraResaWebV4ModelsTransportMode;
    /**
     * 
     * @type {VTApiPlaneraResaWebV4ModelsTransportSubMode}
     * @memberof VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
     */
    transportSubMode?: VTApiPlaneraResaWebV4ModelsTransportSubMode;
    /**
     * The short name of the line, usually 5 characters or less.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
     */
    shortName?: string | null;
    /**
     * The designation of the line.
     * @type {string}
     * @memberof VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
     */
    designation?: string | null;
    /**
     * Flag indicating if the line is wheelchair accessible.
     * @type {boolean}
     * @memberof VTApiPlaneraResaWebV4ModelsJourneysLineApiModel
     */
    isWheelchairAccessible?: boolean;
}

/**
 * Check if a given object implements the VTApiPlaneraResaWebV4ModelsJourneysLineApiModel interface.
 */
export function instanceOfVTApiPlaneraResaWebV4ModelsJourneysLineApiModel(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function VTApiPlaneraResaWebV4ModelsJourneysLineApiModelFromJSON(json: any): VTApiPlaneraResaWebV4ModelsJourneysLineApiModel {
    return VTApiPlaneraResaWebV4ModelsJourneysLineApiModelFromJSONTyped(json, false);
}

export function VTApiPlaneraResaWebV4ModelsJourneysLineApiModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): VTApiPlaneraResaWebV4ModelsJourneysLineApiModel {
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
        'shortName': !exists(json, 'shortName') ? undefined : json['shortName'],
        'designation': !exists(json, 'designation') ? undefined : json['designation'],
        'isWheelchairAccessible': !exists(json, 'isWheelchairAccessible') ? undefined : json['isWheelchairAccessible'],
    };
}

export function VTApiPlaneraResaWebV4ModelsJourneysLineApiModelToJSON(value?: VTApiPlaneraResaWebV4ModelsJourneysLineApiModel | null): any {
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
        'shortName': value.shortName,
        'designation': value.designation,
        'isWheelchairAccessible': value.isWheelchairAccessible,
    };
}

