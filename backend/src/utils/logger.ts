type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const formatTimestamp = (): string => {
  return new Date().toISOString();
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(
      `[${formatTimestamp()}] [INFO]: ${message}`,
      meta ? JSON.stringify(meta) : ''
    );
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(
      `[${formatTimestamp()}] [WARN]: ${message}`,
      meta ? JSON.stringify(meta) : ''
    );
  },
  error: (message: string, error?: unknown) => {
    console.error(`[${formatTimestamp()}] [ERROR]: ${message}`, error ?? '');
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(
        `[${formatTimestamp()}] [DEBUG]: ${message}`,
        meta ? JSON.stringify(meta) : ''
      );
    }
  }
};
