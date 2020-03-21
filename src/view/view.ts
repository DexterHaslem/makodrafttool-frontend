import {inject} from 'aurelia-framework';
import {Api} from '../api';

@inject(Api)
export class View {
  ws: WebSocket;
  draftCode: string;
  api: Api;

  //msgLog: string[];

  constructor(api) {
    this.api = api;
    //this.msgLog = [];
  }

  activate(params) {
    this.draftCode = params.id;
    this.ws = this.api.getWs(this.draftCode);
    this.ws.onopen = this.onWsOpen;
    this.ws.onclose = this.onWsClose;
    this.ws.onerror = this.onWsError;
    this.ws.onmessage = this.onWsMessage;
  }

  private onWsOpen(ev: Event) {
    console.log("websocket opened");
  }

  private onWsClose(ev: CloseEvent) {
    console.log("websocket closed");
  }

  private onWsError(ev: Event) {
    console.log("websocket error");
  }

  private onWsMessage(msgEvent: MessageEvent) {
    console.log("received websocket message:" + JSON.stringify(msgEvent));
  }
}
