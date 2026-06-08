const levels = { info: "ℹ️", warn: "⚠️", error: "❌", debug: "🔍" };

function log(level, ...args) {
  const ts = new Date().toISOString();
  console[level === "error" ? "error" : "log"](
    `[${ts}] ${levels[level] || ""} [${level.toUpperCase()}]`,
    ...args
  );
}

export const logger = {
  info: (...args) => log("info", ...args),
  warn: (...args) => log("warn", ...args),
  error: (...args) => log("error", ...args),
  debug: (...args) => log("debug", ...args),
};
