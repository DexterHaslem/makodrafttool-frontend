import {inject} from 'aurelia-framework';
import {Api} from '../api';
import * as R from 'ramda';
import {
  Champion,
  Champions,
  DraftState,
  PhaseType,
  PhaseVote,
  SessionType,
  WebsocketMessageType,
  WsMsgBase,
  WsMsgSnapshot,
  WsMsgTimerOnly
} from "../models";
import {prettyChampName} from "../util";


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

  // local state copy of phase votes for admin to send edited copy for override
  votesCopy: PhaseVote[];

  /* this got a little gnarly. the server sends a snapshot of all state regularly and we dumbly display it, and send
  requests to edit it. future improvement would be using state management (aurelia-store +rxjs) if it gets too unweildy.
  ui is not broken out to components either so the dom is a bit messy
   */

  constructor(api) {
    this.api = api;
    this.connecting = true;
    this.selectedVoteValue = 'none';

    // enable by default incase they refresh
    this.lockinEnabled = true;
  }

  activate(params, route) {
    this.draftCode = params.id;

    this.api.getChampions().then(c => {
      this.champions = c;
      this.validChampions = R.clone(c);
    }).then(() => {
      // get draft state after champions so that we can always resolve champ names
      this.api.getDraftState(this.draftCode).then(st => this.draftState = st);
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
      voteUnlimitedTime: false,
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

  private sendWsSnap(msgSnapshot: WsMsgSnapshot) {
    this.ws.send(JSON.stringify(msgSnapshot));
  }

  private sendWsMsg(mt: WebsocketMessageType) {
    const mb: WsMsgBase = {
      msgType: mt,
    };
    this.ws.send(JSON.stringify(mb));
  }

  private overrideVote(phaseVote: PhaseVote) {
    let voteOverride = View.createWsSnapshot(WebsocketMessageType.adminVoteOverride);
    // this is modified locally by admin, just send the whole thing
    voteOverride.currentVote = phaseVote;
    this.sendWsSnap(voteOverride);
  }

  private sendReady() {
    this.sendWsMsg(WebsocketMessageType.clientReady);
  }

  private togglePauseTimer() {
    this.sendWsMsg(WebsocketMessageType.adminPauseTimer);
  }

  private resetTimer() {
    this.sendWsMsg(WebsocketMessageType.adminResetTimer);
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

  getReadyText() {
    if (!this.snapshot) {
      return 'No';
    }

    const ret = (this.draftState.sessionType === SessionType.Red && this.snapshot.redReady) ||
      (this.draftState.sessionType === SessionType.Blue && this.snapshot.blueReady);
    return ret ? 'Yes' : 'No';
  }

  private onWsOpen(ev: Event) {
    this.connecting = false;
    this.connectionFailed = false;
  }

  private onWsClose(ev: CloseEvent) {
    this.connecting = false;
    this.connectionFailed = true;
  }

  private onWsError(ev: Event) {
    console.error("websocket error: ", ev);
  }

  public getViewingLink() {
    // !! baseUrl
    return `#/v/${this.draftState.viewerCode}`;
  }

  public getReportLink() {
    return this.api.getApiURL(`draftReport/${this.draftState.viewerCode}`);
  }

  getChampDisabled(c: Champion): boolean {
    if (!c || !this.snapshot || !this.draftState || !this.snapshot.currentVote) {
      return false;
    }

    const validChoices = this.draftState.sessionType == SessionType.Red ? this.snapshot.currentVote.validRedValues :
      this.snapshot.currentVote.validBlueValues;

    return R.all(vn => c.name !== vn, validChoices);
  }

  private startDraftVoting() {
    this.sendWsMsg(WebsocketMessageType.startVoting);
  }

  private lockinVote() {
    let m: WsMsgSnapshot = View.createWsSnapshot(WebsocketMessageType.voteAction);

    // note none of these values are needed other than vote value. just need proper dto
    m.currentVote = {
      phaseType: PhaseType.ban,
      hasVoted: false, phaseNum: 0, validBlueValues: [], validRedValues: [],
      redHasVoted: false,
      blueHasVoted: false,
      adminOverride: false,
      voteBlueValue: this.selectedVoteValue,
      voteRedValue: this.selectedVoteValue,
    };
    this.sendWsSnap(m);
    this.lockinEnabled = false;
  }

  private prettyVoteValue(champName: string): string {
    if (!this.champions) {
      return champName;
    }

    return prettyChampName(this.champions, champName);
  }

  private onWsMessage(msgEvent: MessageEvent) {
    let mb: WsMsgBase = JSON.parse(msgEvent.data);
    if (mb.msgType == WebsocketMessageType.snapshot) {
      const ss: WsMsgSnapshot = <WsMsgSnapshot>mb;
      this.prevSnapshot = this.snapshot;
      this.snapshot = ss;
      this.gotSnapshot = true;

      // we can beat draftstate coming in , beware that on spamming refresh
      if (ss.voteActive && this.draftState) {
        this.lockinEnabled = (
          (this.draftState.sessionType == SessionType.Red && !ss.currentVote.redHasVoted) ||
          (this.draftState.sessionType == SessionType.Blue && !ss.currentVote.blueHasVoted)
        );

        if (!this.lockinEnabled) {
          this.selectedVoteValue =
            this.draftState.sessionType == SessionType.Red ? ss.currentVote.voteRedValue : ss.currentVote.voteBlueValue;
        }

        //this.filterValidChamps(this.draftState.sessionType == SessionType.Red ? ss.currentVote.validRedValues : ss.currentVote.validBlueValues);
      }

      // copy vote state if we're not actively voting to prevent it bouncing on us
      if (!ss.voteActive) {
        this.votesCopy = R.clone(ss.phases);
        this.selectedVoteValue = 'none';
      }
    }

    if (mb.msgType == WebsocketMessageType.snapshotTimerOnly) {
      const tm: WsMsgTimerOnly = <WsMsgTimerOnly>mb;
      this.snapshot.voteTimeLeftPretty = tm.voteTimeLeftPretty;
    }
  }

  /* do not add/remove from options, simply disable above
  private filterValidChamps(validNames : string[]) {
    // this ends up a little nasty due to the categories
    this.validChampions.melee = [];
    this.validChampions.ranged = [];
    this.validChampions.support = [];
  }*/
}
