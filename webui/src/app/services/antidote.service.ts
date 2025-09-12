import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AntidoteService {
  private ws: WebSocket | null = null;
  private connectedPort: number | null = null;
  private reconnectDelay = 2000; // ms avant retry
  private reconnecting = false;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();

  // 4989 (default?) + dynamic range
  private candidatePorts = [4989, 49152, 49153, 49154, 49155, 49156, 49157, 49158, 49159, 49160];

  constructor() {
    // TODO: enable once done
    // this.tryConnect();
  }

  private async tryConnect() {
    for (const port of this.candidatePorts) {
      try {
        const success = await this.tryPort(port);
        if (success) {
          this.connectedPort = port;
          console.log('[Antidote] Connected on port', port);
          break;
        }
      } catch (e) {
        // try next
      }
    }
    if (!this.ws) {
      console.error('[Antidote] Cannot find active port.');
    }
  }

  private tryPort(port: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`);

      const timer = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout'));
      }, 2000);

      ws.onopen = () => {
        clearTimeout(timer);
        this.ws = ws;
        ws.onclose = () => this.handleDisconnect();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error('WS Error'));
      };
    });
  }

  private handleDisconnect() {
    console.warn('[Antidote] Connection lost.');
    this.ws = null;
    if (!this.reconnecting) {
      this.reconnecting = true;
      setTimeout(() => {
        this.reconnecting = false;
        this.tryConnect();
      }, this.reconnectDelay);
    }
  }

  public getCorrections(text: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject('WebSocket not connected');
      }

      const id = ++this.requestId;

      // store waiting promise
      this.pendingRequests.set(id, { resolve, reject });

      // TODO : use official json structure from unknown doc
      const packet = {
        id,
        action: 'check',
        text
      };

      this.ws.send(JSON.stringify(packet));
    });
  }
}
