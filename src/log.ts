import { pino } from "pino";

const prettyOpts =
  process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        },
      }
    : {};

export const log = pino({ ...prettyOpts });
