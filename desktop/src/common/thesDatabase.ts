export class ThesDatabase {
  items: ThesItem[] = [];

  load(items: ThesItem[]) {
    this.items = items;
  }

  prepareKey(key: string): string {
    return key.trim().toLowerCase();
  }

  getFromKey(key: string): string[] {
    key = this.prepareKey(key);
    const candidate = this.items.find((i) => i.key === key);
    return candidate !== undefined ? candidate.values : [];
  }

  addItem(key: string, value: string): void {
    key = this.prepareKey(key);
    const idx = this.items.findIndex((i) => i.key === key);
    if (idx === -1) {
      this.items.push({ key, values: [value] });
    } else if (this.items[idx] !== undefined) {
      this.items[idx].values.push(value);
    }
  }

  hasItem(item: string): boolean {
    return this.getFromKey(item) !== undefined;
  }

  hasKeyValuePair(key: string, value: string): boolean {
    key = this.prepareKey(key);
    const candidate = this.getFromKey(key);
    return candidate.find((v) => v === value) !== undefined;
  }

  resetKey(key: string): void {
    key = this.prepareKey(key);
    const idx = this.items.findIndex((i) => i.key === key);
    if (idx !== -1 && this.items[idx] !== undefined) {
      this.items[idx].values = [];
    }
  }

  resetAll(): void {
    this.items = [];
  }
}

export class ThesItem {
  key: string = "";
  values: string[] = [];

  constructor(key: string, values: string[]) {
    this.key = key;
    this.values = values;
  }
}
