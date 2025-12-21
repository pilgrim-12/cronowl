# cronowl

Official CLI tool for [CronOwl](https://cronowl.com) - cron job monitoring made simple.

## Installation

```bash
npm install -g cronowl
```

Or use directly with npx:

```bash
npx cronowl <slug>
```

## Usage

### Simple Ping

Send a ping when your cron job completes:

```bash
# At the end of your cron job
cronowl ping abc123def
# or simply
cronowl abc123def
```

### Wrap a Command

Automatically measure execution time and capture output:

```bash
cronowl wrap abc123def -- ./backup.sh
cronowl wrap abc123def -- python process_data.py
cronowl wrap abc123def -- npm run build
```

This will:
1. Signal job start to CronOwl
2. Execute your command
3. Capture duration, exit code, and output
4. Send results to CronOwl
5. Exit with the same code as your command

### Signal Start/End Separately

For long-running jobs, signal start and end separately:

```bash
# At the start
cronowl ping abc123def --start

# Your job runs...

# At the end
cronowl ping abc123def --duration 12345 --exit-code 0
```

### Report Failures

```bash
# Mark as failed
cronowl ping abc123def --fail

# Or with specific exit code
cronowl ping abc123def --exit-code 1 --output "Error: disk full"
```

## Options

### `cronowl ping <slug>`

| Option | Description |
|--------|-------------|
| `-d, --duration <ms>` | Execution duration in milliseconds |
| `-e, --exit-code <code>` | Exit code (0 = success, non-zero = failure) |
| `-o, --output <text>` | Output/log message (max 10KB) |
| `--fail` | Mark this ping as a failure |
| `--start` | Signal the start of a job |
| `-q, --quiet` | Suppress output |
| `--base-url <url>` | Custom API base URL |

### `cronowl wrap <slug> [command...]`

| Option | Description |
|--------|-------------|
| `-q, --quiet` | Suppress cronowl output (command output still shown) |
| `--no-output` | Don't send command output to CronOwl |
| `--base-url <url>` | Custom API base URL |

## Examples

### Crontab Integration

```crontab
# Simple ping at the end
0 3 * * * /usr/local/bin/backup.sh && cronowl abc123def

# With full wrapping
0 3 * * * cronowl wrap abc123def -- /usr/local/bin/backup.sh

# Quiet mode
0 * * * * cronowl wrap abc123def -q -- /path/to/hourly-job.sh
```

### In Scripts

```bash
#!/bin/bash

# Signal start
cronowl ping abc123def --start

# Your job logic
start_time=$(date +%s%3N)
./do-something.sh
exit_code=$?
end_time=$(date +%s%3N)
duration=$((end_time - start_time))

# Signal completion with metrics
cronowl ping abc123def \
  --duration $duration \
  --exit-code $exit_code \
  --output "$(tail -c 10000 /var/log/job.log)"
```

### Docker

```dockerfile
FROM node:20-alpine

RUN npm install -g cronowl

# Your app setup...

CMD ["cronowl", "wrap", "abc123def", "--", "node", "server.js"]
```

## Exit Codes

- `0` - Ping sent successfully
- `1` - Failed to send ping (network error, invalid slug, etc.)

When using `wrap`, the CLI exits with the same code as the wrapped command.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CRONOWL_BASE_URL` | Override the default API URL |

## Self-hosted

If you're running a self-hosted CronOwl instance:

```bash
cronowl ping abc123def --base-url https://your-cronowl.example.com
```

## License

MIT
