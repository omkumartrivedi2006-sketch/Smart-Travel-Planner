type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = this.getTimestamp();
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
  }

  public info(message: string, meta?: any): void {
    console.log(this.formatMessage("info", message, meta));
  }

  public warn(message: string, meta?: any): void {
    console.warn(this.formatMessage("warn", message, meta));
  }

  public error(message: string, error?: any, meta?: any): void {
    const errMeta = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...meta }
      : { error, ...meta };
    console.error(this.formatMessage("error", message, errMeta));
  }

  public debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== "production") {
      console.log(this.formatMessage("debug", message, meta));
    }
  }
}

export const logger = new Logger();
