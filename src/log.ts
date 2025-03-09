export const log = {
  ...console,
  debug: (...args: unknown[]) =>
    process.env.DEBUG && console.debug.apply(console, args),
  trace: (...args: unknown[]) =>
    process.env.TRACE && console.trace.apply(console, args),
} // pino({ ...prettyOpts });
