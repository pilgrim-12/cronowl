#!/usr/bin/env node

import { program } from "commander";
import { ping } from "./commands/ping.js";
import { wrap } from "./commands/wrap.js";

const VERSION = "1.0.0";

program
  .name("cronowl")
  .description("CLI tool for CronOwl - cron job monitoring made simple")
  .version(VERSION);

// Simple ping command
program
  .command("ping <slug>")
  .description("Send a ping to CronOwl")
  .option("-d, --duration <ms>", "Execution duration in milliseconds")
  .option("-e, --exit-code <code>", "Exit code (0 = success)")
  .option("-o, --output <text>", "Output/log message (max 10KB)")
  .option("--fail", "Mark this ping as a failure")
  .option("--start", "Signal the start of a job (for measuring duration)")
  .option("-q, --quiet", "Suppress output")
  .option("--base-url <url>", "Custom API base URL", "https://cronowl.com")
  .action(ping);

// Wrap command - execute a command and report results
program
  .command("wrap <slug> [command...]")
  .description("Execute a command and report results to CronOwl")
  .option("-q, --quiet", "Suppress cronowl output (command output still shown)")
  .option("--base-url <url>", "Custom API base URL", "https://cronowl.com")
  .option("--no-output", "Don't send command output to CronOwl")
  .action(wrap);

// Shorthand: just the slug pings
program
  .argument("[slug]", "Check slug to ping")
  .option("-q, --quiet", "Suppress output")
  .option("--base-url <url>", "Custom API base URL", "https://cronowl.com")
  .action(async (slug, options) => {
    if (slug && !slug.startsWith("-")) {
      await ping(slug, options);
    } else if (!process.argv.slice(2).length) {
      program.help();
    }
  });

program.parse();
