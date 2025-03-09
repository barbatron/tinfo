import { Elysia } from "elysia"
import getIndex, { getHelp } from "./html-template"
import { log } from "./log"

import dayjs from "dayjs"

import "./init-dayjs.ts"

import {
  DEST_BLOCK_MARGIN_BOT,
  DEST_NAME_OPACITY,
  FETCH_INTERVAL_MS,
  // General API
  MAX_TIME_MINUTES,
  MIN_TIME_MINUTES,
  PAGE_INFO,
  RUSH_SECONDS_GAINED,
  // Esthetic
  STATION_NAME_REPLACEMENTS,
  // Emoji calcs
  WALK_TIME_SECONDS,
} from "./config"
import { createSlTransportApiClient } from "./providers/sl"
import { Departure, DepartureClient, DepartureExt, FetchParams } from "./types"

import * as conf from "./config"
import { createVtClient } from "./providers/vt"
import html from "@elysiajs/html"

const config = conf.fromEnv

const autoUpdateSl = !!config.getString("SL_SITE_ID", false)

type Provider = "SL" | "VT"
const providers: Record<
  Provider,
  {
    client: DepartureClient
    direction: string
    stopName: string
    preferredMot?: string
    timeOffsetSeconds?: number
    lastDeparturesRaw?: Departure[]
    fetchError?: Error | unknown
    autoUpdate: boolean
  } & (
    | { autoUpdate: false }
    | {
        autoUpdate: true
        autoUpdateParams: FetchParams
      }
  )
> = {
  SL: {
    // autoUpdate: true,
    client: createSlTransportApiClient(config),
    direction: config.getString("SL_JOURNEY_DIRECTION", false) ?? "1",
    stopName: "Hökis",
    preferredMot: conf.SL_PAGE_INFO.preferredMot,
    autoUpdate: autoUpdateSl,
    ...(autoUpdateSl
      ? {
          // autoUpdate: true,
          autoUpdateParams: {
            stop_id: config.getString("SL_SITE_ID", autoUpdateSl)!,
            dir: config.getString("SL_JOURNEY_DIRECTION", false) || "1",
            mot: "METRO",
            min_min: 2,
            max_min: 30,
          },
        }
      : { autoUpdate: false }),
  },
  VT: {
    client: createVtClient(config),
    direction: "-",
    stopName: "Marklandsgatan",
    preferredMot: conf.VT_PAGE_INFO.preferredMot,
    autoUpdate: false,
  },
}

const defaultProvider: Provider = "SL"

function p<T extends Provider | string>(
  provider: T
): (typeof providers)[Provider] {
  const k = provider.toUpperCase() as Provider
  if (!providers[k]) throw Error(`No provider for ${provider}`)
  return providers[k]
}

/////////////////////////////

function parseQueryFetchParams(
  query: Record<string, string | undefined>
): FetchParams | undefined {
  const { stop_id, mot, dir, limit, min_min, max_min } = query ?? {}
  if (!stop_id) return
  return {
    stop_id,
    mot: !!mot ? String(mot.trim()) : undefined,
    dir: !!dir ? String(dir.trim()) : undefined,
    min_min: numberOr(min_min, 2),
    max_min: numberOr(max_min, 30),
    limit: numberOr(limit, 10),
  }
}

const numberOr = (v: unknown, def: number) => {
  if (v === undefined || v === null) return def
  if (typeof v === "number") return v
  if (typeof v === "string") {
    const trimmed = v.trim()
    const n = parseInt(trimmed, 10)
    if (isNaN(n)) return def
    return n
  }
  return def
}

const clampTime = (time: Date) => {
  const now = new Date()
  if (time < now) return now
  return time.toISOString()
}

const decorateDepartures = (departures: Departure[] = []): DepartureExt[] =>
  Array.from(departures ?? []).map(decorateDeparture)

const decorateDeparture = (d: Departure): DepartureExt => {
  const d1 = {
    ...d,
    expectedInSeconds: dayjs(d.expectedTime).diff(new Date(), "seconds"),
    scheduleDriftSeconds: dayjs(d.expectedTime).diff(
      d.scheduledTime,
      "seconds"
    ),
  }
  const d2 = {
    ...d1,
    secondsToSpare: d1.expectedInSeconds - WALK_TIME_SECONDS,
    successProb: d1.expectedInSeconds / WALK_TIME_SECONDS,
  }
  const d3 = {
    ...d2,
    successProbPow: Math.pow(d2.successProb, 2),
    canMakeIt: d2.secondsToSpare >= -RUSH_SECONDS_GAINED,
  }
  return d3
}

const isCompleteParams = (params: unknown): params is FetchParams => {
  if (typeof params !== "object" || !params) return false
  const p = params as FetchParams
  return typeof p.stop_id === "string"
}

/////////////////////////////

const updateDepartures = async (
  providerName: Provider,
  params?: Partial<FetchParams>
) => {
  const prov = p(providerName)
  const now = dayjs()
  try {
    const fp = {
      ...(prov.autoUpdate === true ? prov.autoUpdateParams : {}),
      ...params,
    }
    if (!isCompleteParams(fp)) {
      log.warn("[updateDepartures] Update without params", {
        providerName,
        params,
        prov,
      })
      return []
    }
    const allDepartures = await prov.client.fetch(fp)
    const preferredMot = params?.mot ?? prov.preferredMot
    const minTimeUntilDeparture = numberOr(params?.min_min, MIN_TIME_MINUTES)
    const maxTimeUntilDeparture = numberOr(params?.max_min, Infinity)
    log.trace(`[updateDepartures] allDepartures pre-filter`, {
      providerName,
      preferredMot,
      minTimeUntilDeparture,
      maxTimeUntilDeparture,
      prov,
      params,
      departures: allDepartures.map((d) => ({
        expTime: d.expectedTime,
        dir: d.direction,
        mot: d.mot,
      })),
    })
    const departures = allDepartures
      // Filter out non-metro departures
      .filter((d) => !preferredMot || d.mot === preferredMot)
      // Filter out departures that are too near in the future
      .filter(
        (d: Departure) =>
          dayjs(d.expectedTime).diff(now, "minutes") >= minTimeUntilDeparture
      )
      // Filter out departures that are too far in the future
      .filter(
        (d: Departure) =>
          dayjs(d.expectedTime).diff(now, "minutes") <= maxTimeUntilDeparture
      )
      .toSorted((a, b) => a.expectedTime.valueOf() - b.expectedTime.valueOf())
      .slice(0, params?.limit ?? 10)
    log.trace(`[updateDepartures] allDepartures post-filter`, {
      providerName,
      preferredMot,
      minTimeUntilDeparture,
      maxTimeUntilDeparture,
      prov,
      params,
      departures: departures.map((d) => ({
        expTime: d.expectedTime,
        dir: d.direction,
        mot: d.mot,
      })),
    })

    if (!params) {
      // TODO: Remove
      prov.lastDeparturesRaw = [...departures]
      prov.fetchError = undefined
    }
    const loggedDepartures = !!conf.getConfig("DEBUG", false)
      ? departures.map((d) => ({
          expTime: d.expectedTime,
          dir: d.direction,
          mot: d.mot,
        }))
      : "(not debug)"
    log.info(`Updated departures for ${providerName} (#)`, {
      now: new Date().toISOString(),
      params,
      count: departures.length,
      departures: loggedDepartures,
    })

    // Misc clamping experiments if expected time of departure is in the past
    const minExpectedTimeInThePast = departures.reduce((min, m_1) => {
      const expectedTime = dayjs(m_1.expectedTime)
      return expectedTime.isBefore(min) ? expectedTime : min
    }, dayjs())

    const diffSeconds = minExpectedTimeInThePast.diff(dayjs(), "seconds")
    if (Math.abs(diffSeconds) > Math.abs(prov.timeOffsetSeconds ?? Infinity)) {
      prov.timeOffsetSeconds = diffSeconds
    }

    log.debug("minExpectedTimeInThePast", {
      diffSeconds,
      timeOffsetSeconds: prov.timeOffsetSeconds,
    })
    return departures
  } catch (err) {
    prov.fetchError = err
    log.error("updateDepartures failed", err)
  }
}

const render = async (provider: Provider, params?: Partial<FetchParams>) => {
  const prov = p(provider)
  const parms =
    params && Object.values(params).some((v) => !!v) ? params : undefined
  console.log("fetch", provider, parms)
  const departures = await updateDepartures(provider, parms)
  if (prov.fetchError) throw Error("Fetch error", { cause: prov.fetchError })
  if (!departures) return "No departures"

  const decoratedDepartures = decorateDepartures(departures)

  const departuresByDirection = decoratedDepartures.reduce((map, dep) => {
    const key = dep.direction ?? prov.direction
    if (map.has(key)) map.get(key)!.push(dep)
    else map.set(key, [dep])
    return map
  }, new Map<string, DepartureExt[]>())

  log.debug("[render] departuresByDirection", departuresByDirection)

  const renderDirection = (departures: DepartureExt[]) => {
    if (!departures.length) {
      return [`(none for  ${MAX_TIME_MINUTES} minutes)`]
    }
    const realisticDepartures = departures

    // format line strings
    const lines = realisticDepartures.map((departure) => {
      const expectedTime = clampTime(departure.expectedTime)
      const hurryStr =
        departure.successProbPow < 1
          ? departure.successProb < 0
            ? "😵"
            : "😱"
          : "✨"

      let timeLeft = ""
      if (departure.displayTime) timeLeft = departure.displayTime
      else {
        const timeLeftMinutes = dayjs(expectedTime).diff(new Date(), "minutes")
        timeLeft = timeLeftMinutes < 1 ? "<1 min" : `${timeLeftMinutes} min`
      }

      const destStr =
        STATION_NAME_REPLACEMENTS.get(departure.destination) ??
        departure.destination
      return `${hurryStr} ${timeLeft} <span style="opacity: ${DEST_NAME_OPACITY}">${destStr}</span>`
    })
    return lines
  }

  const mainDir = params?.dir ?? prov.direction ?? "-"
  const mainDirectionDepartures = departuresByDirection.get(mainDir)
  log.info("mainDirectionDepartures", mainDirectionDepartures)

  const topLevelLines = renderDirection(mainDirectionDepartures ?? [])

  const otherDirectionKeys = Array.from(departuresByDirection.keys()).filter(
    (k) => k !== mainDir
  )
  const otherDirections = otherDirectionKeys.flatMap((k) =>
    renderDirection(departuresByDirection.get(k) ?? [])
  )

  const topLevelLinesHtml =
    `<div style="display: block; margin-bottom: ${DEST_BLOCK_MARGIN_BOT}; white-space: nowrap">` +
    topLevelLines.join(`<br/>`) +
    "</div>"
  const otherDirectionsHtml = Array.from(departuresByDirection.entries())
    ? '<div style="display: block; margin-bottom: 3rem; opacity: 0.3">' +
      otherDirections.join(`<br/>`) +
      "</div>"
    : ""
  return topLevelLinesHtml + "\n" + otherDirectionsHtml
}

const autoUpdate = () => {
  Promise.allSettled(
    Object.entries(providers)
      .filter(([, provider]) => provider.autoUpdate)
      .map(async ([providerName]) =>
        updateDepartures(providerName as Provider).catch((err) =>
          log.error({ err }, "updateDepartures failed")
        )
      )
  ).finally(() => {
    // Schedule next update
    if (FETCH_INTERVAL_MS && typeof FETCH_INTERVAL_MS === "number") {
      setTimeout(autoUpdate, FETCH_INTERVAL_MS)
    }
  })
}

autoUpdate()

const app = new Elysia()
  .get("/healthz", () => {
    log.info("GET /healthz", { defaultProvider })
    return "OK"
  })
  .get("/", ({ redirect }) => {
    log.info("GET /", { defaultProvider })
    return redirect(`/${defaultProvider}`, 303)
  })

  .use(html())
  .get("/help", ({ request, set }) => {
    log.info("GET /help", { defaultProvider })
    set.headers["content-type"] = "text/html"
    return getHelp(new URL(request.url).origin)
  })

  .get(
    "/:provider",
    async ({ query, params: { provider: providerStr }, set, headers }) => {
      const provider = providerStr.toUpperCase() as Provider
      const prov = p(provider)
      log.info(
        "GET /:provider",
        { providerStr, query, provider },
        headers["user-agent"]
      )
      set.headers["content-type"] = "text/html"
      const fetchParams = parseQueryFetchParams(query)
      if (headers.accept === "application/json") {
        const departures = await updateDepartures(provider, fetchParams)
        set.headers["content-type"] = "application/json"
        return decorateDepartures(departures)
      }
      const content = await render(provider, fetchParams)
      return getIndex({ name: provider, stopName: prov.stopName }, content)
    }
  )
  .get(
    "/:provider/content",
    async ({ query, params: { provider: providerStr }, headers, set }) => {
      const provider = providerStr.toUpperCase() as Provider
      log.info(
        `GET /:provider/content`,
        { provider },
        headers["user-agent"],
        query
      )
      const fetchParams = parseQueryFetchParams(query)
      if (headers.accept === "application/json") {
        const departures = await updateDepartures(provider, fetchParams)
        set.headers["content-type"] = "application/json"
        return decorateDepartures(departures)
      }
      set.headers["content-type"] = "text/html"
      const content = await render(provider, fetchParams)
      return content
    }
  )
  .listen(conf.PORT)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
