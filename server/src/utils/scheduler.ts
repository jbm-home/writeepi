import bunyan from "bunyan";

export class Scheduler {
  log = bunyan.createLogger({ name: "Writeepi:Scheduler", level: "debug" });

  Schedule(
    name: string,
    action: () => void,
    interval: number,
    first: number = 0,
  ) {
    this.log.info(
      `Scheduling new task '${name}' with start at ${first / 1000}s and interval ${interval / 1000}s`,
    );
    setInterval(() => {
      this.log.debug(`Executing task '${name}' from scheduled interval`);
      action();
    }, interval);

    setTimeout(() => {
      this.log.debug(`Executing task '${name}' from scheduled first time`);
      action();
    }, first);
  }
}
