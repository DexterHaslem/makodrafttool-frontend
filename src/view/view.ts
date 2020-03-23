import {inject} from 'aurelia-framework';
import {Api} from '../api';
import * as R from 'ramda';
import {
  Champions,
  DraftState,
  PhaseType,
  SessionType,
  WebsocketMessageType,
  WsMsgBase,
  WsMsgSnapshot,
  WsMsgTimerOnly
} from "../models";

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
  snapshot: WsMsgSnapshot;
  prevSnapshot: WsMsgSnapshot;
  selectedVoteValue: string;
  lockinEnabled: boolean;

  champions: Champions;
  validChampions: Champions;

  constructor(api) {
    this.api = api;
    this.connecting = true;
    this.selectedVoteValue = 'none';
    this.api.getChampions().then(c => {
      this.champions = c;
      this.validChampions = R.clone(c);
    });

    // enable by default incase they refresh
    this.lockinEnabled = true;
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

  private static createWsSnapshot(type: WebsocketMessageType): WsMsgSnapshot {
    let wsm: WsMsgSnapshot = {
      voteTimeLeftPretty: '',
      adminConnected: false,
      draftDone: false,
      draftStarted: false,
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
      votePaused: false,
      voteTimeLeft: 0,
      voteTimedOut: false,
    };
    return wsm;
  }

  private sendWsSnap(m: WsMsgSnapshot) {
    this.ws.send(JSON.stringify(m));
  }

  private sendReady() {
    let wsm: WsMsgSnapshot = View.createWsSnapshot(WebsocketMessageType.clientReady);
    this.sendWsSnap(wsm)
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

  getLockInButtonDisabled() {
    return this.selectedVoteValue === 'none' || !this.lockinEnabled;
  }

  getReadyText() {
    if (!this.snapshot) {
      return 'No';
    }

    const ret = (this.draftState.sessionType === SessionType.Red && this.snapshot.redReady) ||
      (this.draftState.sessionType === SessionType.Blue && this.snapshot.blueReady);
    return ret ? 'Yes' : 'No';
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
    let mb: WsMsgBase = JSON.parse(msgEvent.data);
    if (mb.msgType == WebsocketMessageType.snapshot) {
      const ss: WsMsgSnapshot = <WsMsgSnapshot>mb;
      this.prevSnapshot = this.snapshot;
      this.snapshot = ss;
      this.gotSnapshot = true;

      if (ss.voteActive) {

        this.lockinEnabled = (
          (this.draftState.sessionType == SessionType.Red && !ss.currentVote.redHasVoted) ||
          (this.draftState.sessionType == SessionType.Blue && !ss.currentVote.blueHasVoted)
        );

        if (!this.lockinEnabled) {
          this.selectedVoteValue =
            this.draftState.sessionType == SessionType.Red ? ss.currentVote.voteRedValue : ss.currentVote.voteBlueValue;
        }
      }
    }

    if (mb.msgType == WebsocketMessageType.snapshotTimerOnly) {
      const tm: WsMsgTimerOnly = <WsMsgTimerOnly>mb;
      this.snapshot.voteTimeLeftPretty = tm.voteTimeLeftPretty;
    }
  }

  private startDraftVoting() {
    let m: WsMsgSnapshot = View.createWsSnapshot(WebsocketMessageType.startVoting);
    this.sendWsSnap(m)
  }

  private lockinVote() {
    let m: WsMsgSnapshot = View.createWsSnapshot(WebsocketMessageType.voteAction);
    /* note none of these values are needed other than vote value. just need proper dto */
    m.currentVote = {
      phaseType: PhaseType.ban,
      hasVoted: false, phaseNum: 0, validBlueValues: [], validRedValues: [],
      redHasVoted: false,
      blueHasVoted: false,
      voteBlueValue: this.selectedVoteValue,
      voteRedValue: this.selectedVoteValue,
    };
    this.sendWsSnap(m);
    this.lockinEnabled = false;
  }

  private prettyMapName(mn: string): string {
    return mn;
  }


  private prettyVoteValue(champName: string): string {
    return champName;
  }
}
