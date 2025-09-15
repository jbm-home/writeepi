import { Inject, Injectable, InjectionToken } from '@angular/core';

export interface Correction {
  start: number;
  end: number;
  original: string;
  suggestion: string;
  message: string;
}

export const ANTIDOTE_AUTO_CONNECT = new InjectionToken<boolean>(
  'ANTIDOTE_AUTO_CONNECT',
  { providedIn: 'root', factory: () => true } // valeur par défaut
);

@Injectable({
  providedIn: 'root'
})
export class AntidoteService {
  private ws: WebSocket | null = null;
  private connectedPort: number | null = null;
  private reconnectDelay = 2000;
  private reconnecting = false;
  private initialized = false;
  private commId = 'dw-comm_' + crypto.randomUUID();
  private collectedCorrections: any[] = [];
  private initResolve: (() => void) | null = null;
  private correctionsResolve: ((value: Correction[]) => void) | null = null;
  public connected = false;

  private candidatePorts = [4989, 49152, 49153, 49154, 49155, 49156, 49157, 49158, 49159, 49160];

  constructor(@Inject(ANTIDOTE_AUTO_CONNECT) autoConnect: boolean) {
    if (autoConnect) {
      this.tryConnect();
    }
  }

  available() {
    return this.connected;
  }

  private async tryConnect() {
    for (const port of this.candidatePorts) {
      try {
        const success = await this.tryPort(port);
        if (success) {
          this.connectedPort = port;
          this.connected = true;
          console.log('[Antidote] Connected on port', port);
          setTimeout(() => {
            this.getCorrections('.')
              .then(() => console.log('[Antidote] Warm-up done'))
              .catch(err => console.warn('[Antidote] Warm-up failed', err));
          }, 1000);
          break;
        }
      } catch {
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
        ws.onmessage = (event) => this.handleMessage(event);
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
    this.initialized = false;
    this.connected = false;
    if (!this.reconnecting) {
      this.reconnecting = true;
      setTimeout(() => {
        this.reconnecting = false;
        this.tryConnect();
      }, this.reconnectDelay);
    }
  }

  private base64ToUtf8(b64: string): string {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  private normalizeCorrections(input: any): Correction[] {
    const out: Correction[] = [];

    const corrections = input?.corrections ?? input?.data?.resultats?.corrections ?? [];
    const detections = input?.detections ?? input?.data?.resultats?.detections ?? [];

    for (const corr of corrections) {
      out.push({
        start: corr.intervalle?.borneDebut ?? 0,
        end: corr.intervalle?.borneFin ?? 0,
        original: corr.chaine ?? '',
        suggestion: corr.infobulleCorrection ?? '',
        message: corr.infobulleRetablissement ?? ''
      });
    }

    for (const det of detections) {
      out.push({
        start: det.intervalle?.borneDebut ?? 0,
        end: det.intervalle?.borneFin ?? 0,
        original: '',
        suggestion: det.titre ?? '',
        message: det.description ?? ''
      });
    }

    return out;
  }

  private handleMessage(event: MessageEvent) {
    try {
      const payload = JSON.parse(event.data);
      const msg = payload?.data?.message as string | undefined;

      if (msg === 'finInitialisation' && this.initResolve) {
        this.initialized = true;
        this.initResolve();
        this.initResolve = null;
        return;
      }

      if (msg === 'nouveauDecoupage' && this.initResolve) {
        this.initialized = true;
        this.initResolve();
        this.initResolve = null;
        return;
      }

      if (typeof payload._dib84 === 'string') {
        try {
          const decoded = this.base64ToUtf8(payload._dib84);
          try {
            const parsed = JSON.parse(decoded);
            this.collectedCorrections.push(parsed);
          } catch {
            this.collectedCorrections.push(decoded);
          }
        } catch {
          this.collectedCorrections.push(payload._dib84);
        }
        return;
      }

      if (msg === 'analyseLocale' && payload?.data?.resultats) {
        this.collectedCorrections.push(payload.data.resultats);
        return;
      }

      if (msg === 'nouvelleErreur' && payload?.data) {
        this.collectedCorrections.push(payload.data);
        return;
      }

      if (msg === 'erreursPhrase' && payload?.data) {
        this.collectedCorrections.push(payload.data);
        return;
      }

      if (msg === 'finAnalyse') {
        if (this.correctionsResolve) {
          const unified: Correction[] = this.collectedCorrections.flatMap((c) => {
            if (typeof c === 'string') {
              try {
                return this.normalizeCorrections(JSON.parse(c));
              } catch {
                return [];
              }
            }
            return this.normalizeCorrections(c);
          });
          this.correctionsResolve(unified);
          this.correctionsResolve = null;
        }
        this.collectedCorrections = [];
        return;
      }

      console.debug('[Antidote] Unhandled message:', JSON.stringify(payload));
    } catch (err) {
      console.error('[Antidote] parse error', err, event.data);
    }
  }

  private sendAction(action: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const packet = {
      message: 'actionEncapsuleeCS',
      _dib105: 'correcteurSimple',
      _dib81: this.commId,
      uuidDestinataire: 'serveurCS',
      action: JSON.stringify(action),
      versionPont: '2.0'
    };

    this.ws.send(JSON.stringify(packet));
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    return new Promise<void>((resolve) => {
      this.initResolve = resolve;
      this.sendAction({
        message: 'initialiser',
        versionProtocoleClient: 2,
        zones: ['\u000e\r\n\r\n\r\n'],
        locale: 'fr_CA',
        langueInterface: 'fr',
        infoConnecteur: {
          versionConnecteur: '0.0.0',
          versionBuild: '1',
          origine: 'tronc',
          idConnecteur: 'AntidoteCustomClient',
          manifest: 3,
          plateforme: 'na'
        },
        options: { antiOups: false },
        style: []
      });
    });
  }

  public async getCorrections(text: string): Promise<Correction[]> {
    if (!this.connected) {
      throw new Error('Antidote not available');
    } else if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    await this.ensureInitialized();

    return new Promise<Correction[]>((resolve) => {
      this.correctionsResolve = resolve;
      this.collectedCorrections = [];

      this.sendAction({
        message: 'texte',
        intervalle: { borneDebut: 0, borneFin: 0 },
        texteOriginal: '',
        phrasesInvalidees: [],
        texte: text,
        typeDiff: ''
      });
    });
  }
}
