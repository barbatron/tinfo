export declare namespace Sl {
  export declare namespace TransportApi {
    /* Sites */

    export type SitesResponse = Site[]

    export interface Site {
      id: number
      gid: number
      name: string
      abbreviation?: string
      lat: number
      lon: number
      stop_areas: number[]
      valid: Valid
      alias?: string[]
    }

    export interface Valid {
      from: string
    }

    /* Departures */

    export interface Deviation {
      // TODO
    }

    export interface DeparturesResponse {
      departures: Departure[]
      stop_deviations: Deviation[]
    }

    export interface Departure {
      destination: string
      direction_code: number
      direction: string
      state: string
      display: string
      scheduled: string
      expected: string
      journey: Journey
      stop_area: StopArea
      stop_point: StopPoint
      line: Line
      deviations: Deviation[]
    }

    export interface Journey {
      id: number
      state: string
      prediction_state?: string
    }

    export interface StopArea {
      id: number
      name: string
      type: string
    }

    export interface StopPoint {
      id: number
      name: string
    }

    export interface Line {
      id: number
      designation: string
      transport_mode: "METRO" | "BUS" | "TRAM" | "TRAIN"
    }
  }
}
