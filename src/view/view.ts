import {inject} from 'aurelia-framework';
import {Api} from '../api';
import {DraftState, SessionType, WebsocketMessageType, WsMsg} from "../models";

const TimerUpdateMs = 150;

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
  prevSnapshot: WsMsg;
  voteActiveTimer: any;
  voteStartedAt: number;
  countdownVal: string;
  selectedVoteValue: string;
  lockinEnabled: boolean;

  constructor(api) {
    this.api = api;
    this.connecting = true;
    this.selectedVoteValue = 'foobar';
  }

  activate(params, route) {
    this.draftCode = params.id;
    this.api.getDraftState(this.draftCode)
      .then(st => {
        this.draftState = st;
        route.navModel.router.title = "BR Draft : " + this.getDraftStateName()
      });
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

  private createWsMsg(type: WebsocketMessageType): WsMsg {
    let wsm: WsMsg = {
      adminConnected: false,
      blueConnected: false,
      blueReady: false,
      currentPhase: 0,
      currentVote: null,
      msgType: type,
      phases: [],
      redConnected: false,
      redReady: false,
      resultsViewers: 0,
      setup: undefined,
      voteActive: false,
      voteTimedOut: false,
    };
    return wsm;
  }

  private sendWsMsg(m: WsMsg) {
    this.ws.send(JSON.stringify(m));
  }

  private sendReady() {
    let wsm: WsMsg = this.createWsMsg(WebsocketMessageType.clientReady);
    this.sendWsMsg(wsm)
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
      this.prevSnapshot = this.snapshot;
      this.snapshot = m;
      this.checkTransitions();
      this.gotSnapshot = true;
    }
  }

  private checkTransitions() {
    if (!this.prevSnapshot) {
      return;
    }

    if (!this.prevSnapshot.voteActive && this.snapshot.voteActive) {
      this.voteStartedAt = new Date().getTime();
      this.lockinEnabled = true;
      this.voteActiveTimer = setInterval(this.timerCallback.bind(this), TimerUpdateMs);
    }
  }

  private startPhaseVote() {
    let m: WsMsg = this.createWsMsg(WebsocketMessageType.startVoting);
    this.sendWsMsg(m)
  }

  private lockinVote() {
    let m: WsMsg = this.createWsMsg(WebsocketMessageType.voteAction);
    m.currentVote = {
      hasVoted: false, phaseNum: 0, validBlueValues: [], validRedValues: [],
      redHasVoted: false,
      blueHasVoted: false,
      voteBlueValue: this.selectedVoteValue,
      voteRedValue: this.selectedVoteValue,
    };
    this.sendWsMsg(m)
    this.lockinEnabled = false;
  }

  private timerCallback() {
    let now = new Date().getTime();
    let dif = now - this.voteStartedAt;
    const secsDiff = Math.abs(dif / 1000);
    const remaining = this.draftState.setup.voteSecs - secsDiff;
    this.countdownVal = remaining.toFixed(2);
    if (remaining <= 0) {
      clearInterval(this.voteActiveTimer);
    }
  }
}
