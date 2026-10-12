# NOX FREE MINI BOT

WhatsApp multi-device bot with pairing codes and MongoDB-backed sessions.

## Required database configuration

Copy `.env.example` to `.env` and provide `MONGODB_URI` in that local file, or set it in your deployment's secret environment. The application now refuses to load its configuration when `MONGODB_URI` is missing or blank. Do not put a real connection URI in source files or commit the local `.env` file.

```env
MONGODB_URI=
BOT_NAME="NOX FREE MINI BOT"
```

## Display name

Set `BOT_NAME` in `.env` to choose the displayed name. If it is unset, the default is `NOX FREE MINI BOT`.

The original authorship and license notices are retained in `package.json`,
`app.json`, and `LICENSE`.
