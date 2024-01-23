interface WebsocketPorops {
  onMessageCallback: (message: string) => void;
  wsuri: string;
  isSendHeart?: boolean; // 是否发送心跳
  heartbeatStr?: string; // 心跳字符串
  maxReconnectCount?: number; // 最大重连次数
  onOpenCallback?: () => void;
  onErrorCallback?: () => void;
  onCloseCallback?: () => void;
}
export class WebSocketClient {
  onMessageCallback: (message: string) => void;

  wsuri = '';

  maxReconnectCount = 5; // 最大重连次数

  onOpenCallback?: () => void;

  onCloseCallback?: () => void;

  onErrorCallback?: () => void;

  private isSendHeart = true; // 是否发送心跳

  private heartbeatStr = '{"heart":"-PING-"}'; // 心跳字符串

  private websocket: WebSocket | null = null;

  private connectRetryCount = 0; // 当前重连次数

  private timeoutnum: ReturnType<typeof setTimeout> | null = null;

  private heartbeat: ReturnType<typeof setTimeout> | null = null;

  constructor({
    onMessageCallback,
    wsuri,
    isSendHeart,
    heartbeatStr,
    maxReconnectCount,
    onErrorCallback,
    onCloseCallback,
    onOpenCallback,
  }: WebsocketPorops) {
    this.onMessageCallback = onMessageCallback;
    this.wsuri = wsuri;
    this.isSendHeart = isSendHeart !== false;
    this.heartbeatStr = heartbeatStr ?? this.heartbeatStr;
    this.maxReconnectCount = maxReconnectCount ?? this.maxReconnectCount;
    this.onOpenCallback = onOpenCallback;
    this.onCloseCallback = onCloseCallback;
    this.onErrorCallback = onErrorCallback;
    this.initWebsocket();
  }

  // 初始化weosocket
  initWebsocket() {
    this.websocket = new WebSocket(this.wsuri);
    this.websocket.onmessage = this.onMessage.bind(this);
    this.websocket.onopen = this.onOpen.bind(this);
    this.websocket.onerror = this.onError.bind(this);
    this.websocket.onclose = this.onClose.bind(this);
  }

  onMessage(e: MessageEvent<string>) {
    if (e.data !== this.heartbeatStr) {
      this.onMessageCallback(e.data);
    }
    if (this.isSendHeart) {
      this.sendHeart();
    }
  }

  onOpen() {
    this.connectRetryCount = 0;
    if (this.isSendHeart) {
      this.sendHeart();
    }
    this.onOpenCallback?.();
  }

  send(message: string) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(message);
    }
  }

  onClose() {
    this.onCloseCallback?.();
  }

  // 连接出错-重新连接
  onError(e: Event) {
    this.onErrorCallback?.();
    this.reconnect();
    // eslint-disable-next-line no-console
    console.error('websocket出现错误', e.target);
  }

  get readyState() {
    return this.websocket?.readyState;
  }

  // 心跳保活
  private sendHeart() {
    this.#clearHeatbeatTimeout();
    this.heartbeat = setTimeout(() => {
      // 这里发送一个心跳，后端收到后，返回一个心跳消息，
      if (this.websocket?.readyState === WebSocket.OPEN) {
        // 如果连接正常
        this.send(this.heartbeatStr);
      } else {
        // 否则重连
        this.reconnect();
      }
    }, 18 * 1000);
  }

  #clearHeatbeatTimeout() {
    if (this.heartbeat) {
      clearTimeout(this.heartbeat);
      this.heartbeat = null;
    }
  }

  #clearTimeoutnumTimeout() {
    if (this.timeoutnum) {
      clearTimeout(this.timeoutnum);
      this.timeoutnum = null;
    }
  }

  // 重新连接
  private reconnect() {
    if (this.connectRetryCount >= this.maxReconnectCount) {
      this.#clearTimeoutnumTimeout();
      return;
    }
    // 没连接上会一直重连，设置延迟避免请求过多
    this.#clearTimeoutnumTimeout();
    // eslint-disable-next-line no-console
    console.log(`ws尝试重新连接-第 ${this.connectRetryCount + 1}次`);
    this.timeoutnum = setTimeout(() => {
      // 新连接
      this.initWebsocket();
      this.connectRetryCount += 1;
    }, 10000);
  }

  // 销毁
  destory() {
    this.websocket?.close();
    this.#clearHeatbeatTimeout();
    this.#clearTimeoutnumTimeout();
  }
}
