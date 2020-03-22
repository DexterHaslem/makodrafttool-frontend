import {inject} from 'aurelia-framework';
import {Api} from '../api';
import * as R from 'ramda';
import {Champions, DraftState, PhaseType, SessionType, WebsocketMessageType, WsMsg} from "../models";

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

  champions: Champions;
  validChampions: Champions;

  constructor(api) {
    this.api = api;
    this.connecting = true;
    this.selectedVoteValue = 'none';
    this.api.getChampions().then(c => this.champions = c);

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

  private static createWsMsg(type: WebsocketMessageType): WsMsg {
    let wsm: WsMsg = {
      adminConnected: false,
      draftDone: false,
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
    let wsm: WsMsg = View.createWsMsg(WebsocketMessageType.clientReady);
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
      this.setupNewVote();
    }
  }

  private startPhaseVote() {
    let m: WsMsg = View.createWsMsg(WebsocketMessageType.startVoting);
    this.sendWsMsg(m)
  }

  private lockinVote() {
    let m: WsMsg = View.createWsMsg(WebsocketMessageType.voteAction);
    /* note none of these values are needed other than vote value. just need proper dto */
    m.currentVote = {
      phaseType: PhaseType.ban,
      hasVoted: false, phaseNum: 0, validBlueValues: [], validRedValues: [],
      redHasVoted: false,
      blueHasVoted: false,
      voteBlueValue: this.selectedVoteValue,
      voteRedValue: this.selectedVoteValue,
    };
    this.sendWsMsg(m);
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

  private setupNewVote() {
    this.voteStartedAt = new Date().getTime();
    this.lockinEnabled = true;
    this.voteActiveTimer = setInterval(this.timerCallback.bind(this), TimerUpdateMs);
    this.selectedVoteValue = 'none';

    this.validChampions = {
      melee: R.clone(this.champions.melee),
      ranged: R.clone(this.champions.ranged),
      support: R.clone(this.champions.support)
    };

    /* filter champs to valid selections */
    if (this.isCaptain()) {
      this.filterValidChamps(this.draftState.sessionType == SessionType.Blue ?
        this.snapshot.currentVote.validBlueValues : this.snapshot.currentVote.validRedValues);
    }
  }

  private filterValidChamps(validValues: string[]) {
    // this sorta stinks, maybe breaking out by category is the worst way to do this
    const champValid = c => R.any(v => v === c.name, validValues);
    this.validChampions.melee = R.filter(champValid, this.validChampions.melee);
    this.validChampions.ranged = R.filter(champValid, this.validChampions.ranged);
    this.validChampions.support = R.filter(champValid, this.validChampions.support);
  }
}
