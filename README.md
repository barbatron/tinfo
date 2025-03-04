# Tinfo

"Tinfo" is a web server that fetches and renders upcoming departures. Currently,
only using Swedish kommunaltrafik providers for Stockholm (SL) and Gothenburg
(VT) are supported.

![Screenshot](docs/screenshot.png)

## Development

1. Set up an .env file based on the included example. There are some lines in the beginning of index.ts that declare what providers are updated and whatnot.

2. Start by executing `bun run dev`

Open http://localhost:8000/ (or whatever port is logged during startup) with
your browser to see the result.

## Docker

### Build

```sh
$ bun docker:build
```

### Start

```sh
$ bun run docker:start
```
