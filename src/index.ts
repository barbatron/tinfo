import { Elysia } from "elysia";
import getIndex from "./html-template";
import { log } from "./log";

import dayjs from "dayjs";

import "./init-dayjs.ts";

import {
  DEST_BLOCK_MARGIN_BOT,
  DEST_NAME_OPACITY,
  FETCH_INTERVAL_MS,
  MIN_TIME_MINUTES,
  PAGE_INFO,
  RUSH_SECONDS_GAINED,
  // Esthetic
  STATION_NAME_REPLACEMENTS,
  // General API
  TIME_WINDOW_MINUTES,
  // Emoji calcs
  WALK_TIME_SECONDS,
} from "./config";
import { createSlTransportApiClient } from "./providers/sl";
import { Departure, DepartureExt, FetchParams } from "./types";

import * as conf from "./config";
import { createVtClient } from "./providers/vt";
import { DepartureClient } from "./providers/types";

const config = conf.fromEnv;

const startTime = new Date();

type Provider = "SL" | "VT";
const providers: Record<
  Provider,
  {
    client: DepartureClient;
    direction: string;
    stopName: string;
    preferredMot: string;
    timeOffsetSeconds?: number;
    lastDeparturesRaw?: Departure[];
    fetchError?: Error | unknown;
  }
> = {
  SL: {
    client: createSlTransportApiClient(config),
    direction: config.getString("SL_JOURNEY_DIRECTION", false) ?? "1",
    stopName: "Hökis",
    preferredMot: conf.SL_PAGE_INFO.preferredMot,
  },
  VT: {
    client: createVtClient(config),
    direction: "-",
    stopName: "Marklandsgatan",
    preferredMot: conf.VT_PAGE_INFO.preferredMot,
  },
};

const defaultProvider: Provider = "SL";

function p<T extends Provider | string>(
  provider: T
): (typeof providers)[Provider] {
  const k = provider.toUpperCase() as Provider;
  if (!providers[k]) throw Error(`No provider for ${provider}`);
  return providers[k];
}

/////////////////////////////

const clampTime = (time: Date) => {
  const now = new Date();
  if (time < now) return now;
  return time.toISOString();
};

const decorateDepartures = (departures: Departure[] = []): DepartureExt[] =>
  Array.from(departures ?? []).map(decorateDeparture);

const decorateDeparture = (d: Departure): DepartureExt => {
  const d1 = {
    ...d,
    expectedInSeconds: dayjs(d.expectedTime).diff(new Date(), "seconds"),
    scheduleDriftSeconds: dayjs(d.expectedTime).diff(
      d.scheduledTime,
      "seconds"
    ),
  };
  const d2 = {
    ...d1,
    secondsToSpare: d1.expectedInSeconds - WALK_TIME_SECONDS,
    successProb: d1.expectedInSeconds / WALK_TIME_SECONDS,
  };
  const d3 = {
    ...d2,
    successProbPow: Math.pow(d2.successProb, 2),
    canMakeIt: d2.secondsToSpare >= -RUSH_SECONDS_GAINED,
  };
  return d3;
};

/////////////////////////////

const updateDepartures = async (
  providerName: Provider,
  params?: Partial<FetchParams>
) => {
  const prov = p(providerName);
  const now = dayjs();
  try {
    const allDepartures = await prov.client.fetch(params);
    const departures = allDepartures
      // Filter out non-metro departures
      .filter((d) => d.mot === (params?.mot ?? prov.preferredMot))
      // Filter out departures that are too near in the future
      .filter(
        (d) =>
          dayjs(d.expected).diff(now, "minutes") >=
          Number(params?.min_min ?? MIN_TIME_MINUTES)
      )
      // Filter out departures that are too far in the future
      .filter(
        (d) => dayjs(d.expected).diff(now, "minutes") <= TIME_WINDOW_MINUTES
      );
    if (!params) {
      prov.lastDeparturesRaw = [...departures];
      prov.fetchError = undefined;
    }
    log.info(
      `Updated departures for ${providerName} (#)`,
      new Date().toISOString(),
      params,
      departures.length
    );
    log.debug(
      "Departures",
      params,
      departures.map((m) => ({
        destination: m.destination,
        scheduledTime: m.scheduledTime,
        expectedTime: m.expectedTime,
        displayTime: m.displayTime,
      }))
    );

    // Misc clamping experiments if expected time of departure is in the past
    const minExpectedTimeInThePast = departures.reduce((min, m_1) => {
      const expectedTime = dayjs(m_1.expectedTime);
      return expectedTime.isBefore(min) ? expectedTime : min;
    }, dayjs());

    const diffSeconds = minExpectedTimeInThePast.diff(dayjs(), "seconds");
    if (Math.abs(diffSeconds) > Math.abs(prov.timeOffsetSeconds ?? Infinity)) {
      prov.timeOffsetSeconds = diffSeconds;
    }

    log.debug("minExpectedTimeInThePast", {
      diffSeconds,
      timeOffsetSeconds: prov.timeOffsetSeconds,
    });
    return departures;
  } catch (err) {
    prov.fetchError = err;
    log.error("updateDepartures failed", err);
  }
};

const render = async (provider: Provider, params?: Partial<FetchParams>) => {
  const prov = p(provider);
  const parms =
    params && Object.values(params).some((v) => !!v) ? params : undefined;
  console.log("fetch", provider, parms);
  const departures = await updateDepartures(provider, parms);
  if (prov.fetchError) throw Error("Fetch error", { cause: prov.fetchError });
  if (!departures) return "No departures";

  const decoratedDepartures = decorateDepartures(departures);

  const departuresByDirection = decoratedDepartures.reduce((map, dep) => {
    const key = dep.direction ?? prov.direction;
    if (map.has(key)) map.get(key)!.push(dep);
    else map.set(key, [dep]);
    return map;
  }, new Map<string, DepartureExt[]>());

  log.debug("[render] departuresByDirection", departuresByDirection);

  const renderDirection = (departures: DepartureExt[]) => {
    if (!departures.length) {
      return [`(none for  ${TIME_WINDOW_MINUTES} minutes)`];
    }
    const realisticDepartures = departures;

    // format line strings
    const lines = realisticDepartures.map((departure) => {
      const expectedTime = clampTime(departure.expectedTime);
      const hurryStr =
        departure.successProbPow < 1
          ? departure.successProb < 0
            ? "😵"
            : "😱"
          : "✨";

      let timeLeft = "";
      if (departure.displayTime) timeLeft = departure.displayTime;
      else {
        const timeLeftMinutes = dayjs(expectedTime).diff(new Date(), "minutes");
        timeLeft = timeLeftMinutes < 1 ? "<1 min" : `${timeLeftMinutes} min`;
      }

      const destStr =
        STATION_NAME_REPLACEMENTS.get(departure.destination) ??
        departure.destination;
      return `${hurryStr} ${timeLeft} <span style="opacity: ${DEST_NAME_OPACITY}">${destStr}</span>`;
    });
    return lines;
  };

  const mainDir = params?.dir ?? prov.direction ?? "-";
  const mainDirectionDepartures = departuresByDirection.get(mainDir);
  log.info("mainDirectionDepartures", mainDirectionDepartures);

  const topLevelLines = renderDirection(mainDirectionDepartures ?? []);

  const otherDirectionKeys = Array.from(departuresByDirection.keys()).filter(
    (k) => k !== mainDir
  );
  const otherDirections = otherDirectionKeys.flatMap((k) =>
    renderDirection(departuresByDirection.get(k) ?? [])
  );

  const topLevelLinesHtml =
    `<div style="display: block; margin-bottom: ${DEST_BLOCK_MARGIN_BOT}; white-space: nowrap">` +
    topLevelLines.join(`<br/>`) +
    "</div>";
  const otherDirectionsHtml = Array.from(departuresByDirection.entries())
    ? '<div style="display: block; margin-bottom: 3rem; opacity: 0.3">' +
      otherDirections.join(`<br/>`) +
      "</div>"
    : "";
  return topLevelLinesHtml + "\n" + otherDirectionsHtml;
};

const doUpdate = () => {
  Object.keys(providers).forEach((providerName) => {
    void updateDepartures(providerName as Provider).catch((err) =>
      log.error({ err }, "updateDepartures failed")
    );
  });
};

if (FETCH_INTERVAL_MS && typeof FETCH_INTERVAL_MS === "number") {
  setInterval(doUpdate, FETCH_INTERVAL_MS);
}
doUpdate();

const app = new Elysia()
  .get("/", ({ redirect }) => {
    return redirect(`/${defaultProvider}`, 303);
  })

  .get("/healthz", () => {
    return "OK";
  })

  .get("/content", ({ redirect }) => {
    return redirect(`/${defaultProvider}/content`, 303);
  })

  .get(
    "/:provider",
    async ({ query, params: { provider: providerStr }, set, headers }) => {
      const provider = providerStr.toUpperCase() as Provider;
      const prov = p(provider);
      log.info("GET /:provider", { provider }, headers["user-agent"], query);
      if (prov.fetchError) {
        throw prov.fetchError;
      }
      set.headers["content-type"] = "text/html";
      const { stop_id, mot, dir } = query ?? {};
      const fetchParams: Partial<FetchParams> | undefined =
        !!stop_id || !!mot || !!dir
          ? {
              stop_id: !!stop_id ? String(stop_id) : undefined,
              mot: !!mot ? String(mot) : undefined,
              dir: !!dir ? String(dir) : undefined,
            }
          : undefined;
      const content = await render(provider, fetchParams);
      return getIndex({ name: provider, stopName: prov.stopName }, content);
    }
  )

  .get(
    "/:provider/content",
    async ({ query, params: { provider: providerStr }, headers, set }) => {
      const provider = providerStr.toUpperCase() as Provider;
      log.info(
        `GET /:provider/content`,
        { provider },
        headers["user-agent"],
        query
      );
      set.headers["content-type"] = "text/html";
      const { stop_id, mot, dir } = query ?? {};
      const fetchParams: Partial<FetchParams> | undefined =
        !!stop_id || !!mot || !!dir
          ? {
              stop_id: !!stop_id ? String(stop_id) : undefined,
              mot: !!mot ? String(mot) : undefined,
              dir: !!dir ? String(dir) : undefined,
            }
          : undefined;
      const content = await render(provider, fetchParams);
      return content;
    }
  )

  .listen(conf.PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
