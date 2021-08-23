const chalk = require('chalk');

const LOG_TYPES = {
  NONE: 0,
  ERROR: 1,
  NORMAL: 2,
  DEBUG: 3,
  FFDEBUG: 4
};

let logType = LOG_TYPES.NORMAL;

export const setLogType = (type: number) => {
  logType = type;
};

export const logTime = () => {
  let nowDate = new Date();
  return nowDate.toLocaleDateString() + ' ' + nowDate.toLocaleTimeString([], { hour12: false });
};

export const log = (...args: any[]) => {
  if (logType < LOG_TYPES.NORMAL) return;

  console.log(logTime(), process.pid, chalk.bold.green('[INFO]'), ...args);
};

export const error = (...args: any[]) => {
  if (logType < LOG_TYPES.ERROR) return;

  console.log(logTime(), process.pid, chalk.bold.red('[ERROR]'), ...args);
};

export const debug = (...args: any[]) => {
  if (logType < LOG_TYPES.DEBUG) return;

  console.log(logTime(), process.pid, chalk.bold.blue('[DEBUG]'), ...args);
};

export const ffdebug = (...args: any[]) => {
  if (logType < LOG_TYPES.FFDEBUG) return;

  console.log(logTime(), process.pid, chalk.bold.blue('[FFDEBUG]'), ...args);
};

export default {
  setLogType: setLogType,
  logTime: logTime,
  log: log,
  error: error,
  debug: debug,
  ffdebug: ffdebug
}