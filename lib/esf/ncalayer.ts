// NCALayer — локальное приложение пользователя для подписания ЭЦП РК.
// Слушает на ws://127.0.0.1:13579. Работает только в браузере (десктоп) —
// этот класс предназначен для использования внутри клиентских компонентов.
// Подпись происходит ЛОКАЛЬНО у пользователя, ключи ЭЦП на сервер не передаются.

const NCALAYER_URL = "ws://127.0.0.1:13579";
const CONNECT_TIMEOUT_MS = 5000;

export type NcaLayerStorage = "PKCS12" | "AKKaztokenStore";

interface NcaLayerResponse {
  id?: string;
  result?: {
    xml?: string;
    message?: string;
  };
  errorCode?: string;
}

export class NCALayerClient {
  private ws: WebSocket | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const ws = new WebSocket(NCALAYER_URL);
      this.ws = ws;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("Timeout"));
      }, CONNECT_TIMEOUT_MS);

      ws.onopen = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };

      ws.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(
          new Error("NCALayer не запущен. Скачайте и запустите NCALayer с сайта pki.gov.kz")
        );
      };
    });
  }

  async signXml(xmlString: string, selectedStorage: NcaLayerStorage = "PKCS12"): Promise<string> {
    if (!this.ws) throw new Error("Нет соединения с NCALayer — вызовите connect() сначала");
    const ws = this.ws;

    return new Promise((resolve, reject) => {
      const requestId = Date.now().toString();

      function handleMessage(event: MessageEvent) {
        let response: NcaLayerResponse;
        try {
          response = JSON.parse(event.data as string);
        } catch {
          return;
        }
        if (response.id !== requestId) return;

        ws.removeEventListener("message", handleMessage);

        if (response.result?.xml) {
          resolve(response.result.xml);
        } else {
          reject(new Error(response.result?.message || "Ошибка подписания"));
        }
      }

      ws.addEventListener("message", handleMessage);

      const request = {
        id: requestId,
        method: "signXml",
        params: {
          selectedStorage,
          xmlToSign: xmlString,
          signingRequired: true,
          encapsulatedContentTypeIdentifier: "id-signedData",
        },
      };

      ws.send(JSON.stringify(request));
    });
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
