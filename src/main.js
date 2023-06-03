require("dotenv").config();

const dayjs = require("dayjs");
var relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

const REALTIME_API_KEY = process.env.SL_REALTIME_API_KEY;
const SITE_ID = process.env.SL_SITE_ID;
const JOURNEY_DIRECTION = Number(process.env.SL_JOURNEY_DIRECTION);
const TIME_WINDOW_MINUTES = 20;
const WALK_TIME_SECONDS = 5 * 60;

async function fetchNextDeparture() {
  const url = new URL("https://api.sl.se/api2/realtimedeparturesV4.json");
  url.searchParams.set("key", REALTIME_API_KEY);
  url.searchParams.set("siteid", SITE_ID);
  url.searchParams.set("timewindow", TIME_WINDOW_MINUTES);
  url.searchParams.set("Bus", "false");

  const response = await fetch(url);
  if (!response.ok) throw Error("Request failed");
  const data = await response.json();

  const metros = data.ResponseData.Metros;
  const metrosRightDirection = metros.filter(
    (metroDeparture) => metroDeparture.JourneyDirection === JOURNEY_DIRECTION
  );
  // console.log(
  //   "next expected departures",
  //   metrosRightDirection.map((dep) => dep.ExpectedDateTime)
  // );
  return metrosRightDirection;
}

fetchNextDeparture()
  .then((departures) => {
    if (!departures.length) return;
    const departuresWithSeconds = departures
      .map((d) => ({
        ...d,
        expectedInSeconds: dayjs(d.ExpectedDateTime).diff(
          new Date(),
          "seconds"
        ),
      }))
      .map((d) => ({
        ...d,
        canMakeIt: d.expectedInSeconds / WALK_TIME_SECONDS,
      }));
    // console.log(departuresWithSeconds);
    const realisticDepartues = departuresWithSeconds.filter(
      (d) => WALK_TIME_SECONDS - d.expectedInSeconds >= -30
    );
    realisticDepartues.forEach((departure) => {
      const timeTableTime = departure.TimeTabledDateTime;
      const expectedTime = departure.ExpectedDateTime;
      const minutesLate = Math.round(
        dayjs(timeTableTime).diff(expectedTime, "minutes")
      );
      const minutesLateStr =
        minutesLate >= 1
          ? `(${minutesLate} min late)`
          : minutesLate < 0
          ? `(${Math.abs(minutesLate)} min early)`
          : "";
      const timeMinutes = dayjs(expectedTime).fromNow();
      console.log(
        `Upcoming departure: ${timeMinutes} (${Math.round(
          departure.canMakeIt * 100
        )}% chance to make it) ${minutesLateStr}`
      );
    });
  })
  .catch((err) => console.error(err));
