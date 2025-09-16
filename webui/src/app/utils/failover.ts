export class Failover {
  static FAILOVERS = ['failover1', 'failover2', 'failover3'];

  static getBestFailover() {
    const foundFailovers: any[] = [];
    Failover.FAILOVERS.forEach((f) =>
      foundFailovers.push({ name: f, data: localStorage.getItem(f) }),
    );

    const firstEmpty = foundFailovers.filter((f) => f.data === null);
    if (firstEmpty.length > 0) {
      return firstEmpty[0].name;
    }

    const defaultData = '{ time: 0 }';
    return foundFailovers.sort(
      (a, b) =>
        JSON.parse(a.data ?? defaultData).time -
        JSON.parse(b.data ?? defaultData).time,
    )[0].name;
  }

  static hasAvailableFailover() {
    return (
      Failover.FAILOVERS.find((f) => localStorage.getItem(f) !== null) !==
      undefined
    );
  }

  static loadAllFailovers() {
    const foundFailovers: any[] = [];
    let inc = 0;
    Failover.FAILOVERS.forEach((f) => {
      const current = localStorage.getItem(f);
      if (current !== null) {
        const p = JSON.parse(current);
        if (p.data !== undefined) {
          if (p.data.title !== undefined && p.data.title !== '') {
            p.data.title = '[Recovery] ' + p.data.title;
          } else {
            p.data.title = '[Recovery] No title';
          }
          foundFailovers.push({
            id: inc++,
            time: p.time,
            title: p.data?.title,
            data: p.data,
          });
        }
      }
    });
    return foundFailovers;
  }

  static cleanAllFailover() {
    Failover.FAILOVERS.forEach((f) => localStorage.removeItem(f));
  }
}
