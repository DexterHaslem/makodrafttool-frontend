import {inject} from 'aurelia-framework';
import {Api} from '../api';
import {DraftState, SessionType, WebsocketMessageType, WsMsg} from "../models";

@inject(Api)
export class View {
  api: Api;
  ws: WebSocket;
  draftCode: string;
  draftState: DraftState;

  connectionFailed: boolean;
  connecting: boolean;
  gotSnapshot: boolean;
  snapshot: WsMsg;

  constructor(api) {
    this.api = api;
    this.connecting = true;
  }

  activate(params) {
    this.draftCode = params.id;
    this.api.getDraftState(this.draftCode)
      .then(st => this.draftState = st);
    this.ws = this.api.getWs(this.draftCode);
    this.ws.onopen = this.onWsOpen.bind(this);
    this.ws.onclose = this.onWsClose.bind(this);
    this.ws.onerror = this.onWsError.bind(this);
    this.ws.onmessage = this.onWsMessage.bind(this);
  }

  private isAdmin(): boolean {
    return this.draftState && this.draftState.sessionType == SessionType.Admin;
  }

  private isCaptain(): boolean {
    return this.draftState && (this.draftState.sessionType == SessionType.Red ||
      this.draftState.sessionType == SessionType.Blue);
  }

  private getDraftStateName() {
    if (this.draftState) {
      switch (this.draftState.sessionType) {
        case SessionType.Admin:
          return "Admin";
        case SessionType.Blue:
          return "Blue captain";
        case SessionType.Red:
          return "Red captain";
        case SessionType.Results:
          return "Results viewer";
      }
    }

    return "UNKNOWN";
  }

  private onWsOpen(ev: Event) {
    console.log("websocket opened");
    this.connecting = false;
    this.connectionFailed = false;
  }

  private onWsClose(ev: CloseEvent) {
    console.log("websocket closed", ev);
    this.connecting = false;
    this.connectionFailed = true;
  }

  private onWsError(ev: Event) {
    console.log("websocket error: ", ev);
  }

  private onWsMessage(msgEvent: MessageEvent) {
    let m: WsMsg = JSON.parse(msgEvent.data);
    // console.log("received websocket message:", m);
    if (m.msgType == WebsocketMessageType.snapshot) {
      this.snapshot = m;
      this.gotSnapshot = true;
    }
  }
}
