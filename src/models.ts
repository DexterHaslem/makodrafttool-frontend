/* these models correspond to the go models */

export enum SessionType {
  Admin = 1,
  Blue,
  Red,
  Results
}

export class DraftSetup {
  name: string;
  mapName: string;
  blueName: string;
  redName: string;
  voteSecs: number;
  countdownSecs: number;
}

export class DraftState {
  sessionType: SessionType;
  setup: DraftSetup;
}

export class DraftIDs {
  admin: string;
  blue: string;
  red: string;
  results: string;
}

export class Draft {
  setup: DraftSetup;
  ids: DraftIDs;
}

/* websocket types */
export enum WebsocketMessageType {
  snapshot = 1,
  voteAction,
  clientClose,
  serverClose,
  clientReady,
  startVoting,
}

export class PhaseVote {
  hasVoted: boolean;
  phaseNum: number;
  redHasVoted: boolean;
  blueHasVoted: boolean;
  validRedValues: string[];
  validBlueValues: string[];
  voteRedValue: string;
  voteBlueValue: string;
}

export class WsMsg {
  msgType: WebsocketMessageType;
  //sessionType: SessionType;
  setup: DraftSetup;
  adminConnected: boolean;
  redConnected: boolean;
  blueConnected: boolean;
  resultsViewers: number;
  voteTimedOut: boolean;
  redReady: boolean;
  blueReady: boolean;
  voteActive: boolean;
  currentVote: PhaseVote;
  currentPhase: number;
  phases: PhaseVote[];
}
