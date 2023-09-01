// Time settings
const dayjs = await import("dayjs");

// @ts-ignore
dayjs.extend(await import("dayjs/plugin/relativeTime"));
// @ts-ignore
dayjs.extend(await import("dayjs/plugin/updateLocale"));

// @ts-ignore
dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "a few seconds",
    m: "a minute",
    mm: "%d min",
    h: "an h",
    hh: "%d hrs",
    d: "a day",
    dd: "%d days",
    M: "a month",
    MM: "%d months",
    y: "a year",
    yy: "%d years",
  },
});
