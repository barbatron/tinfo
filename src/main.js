require("dotenv").config();
const dayjs = require("dayjs");

const REALTIME_API_KEY = process.env.SL_REALTIME_API_KEY;
const SITE_ID = process.env.SL_SITE_ID;
const JOURNEY_DIRECTION = Number(process.env.SL_JOURNEY_DIRECTION);
const TIME_WINDOW_MINUTES = 20;

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
  console.log(
    "next expected departures",
    metrosRightDirection.map((dep) => dep.ExpectedDateTime)
  );
  const nextDeparture = metrosRightDirection[0];
  if (!nextDeparture) return undefined;
  console.log("nextDeparture", nextDeparture);
  return nextDeparture;
}

fetchNextDeparture()
  .then((departure) => {
    if (!departure) return;
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
    const timeMinutes = dayjs(expectedTime).diff(dayjs(), "minutes");
    console.log(`Next departure: ${timeMinutes} min ${minutesLateStr}`);
  })
  .catch((err) => console.error(err));
