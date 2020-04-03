import {inject} from 'aurelia-framework';
import {
  Champion,
  Champions,
  DraftState,
  PhaseType,
  PhaseVote,
  WebsocketMessageType,
  WsMsgBase,
  WsMsgSnapshot
} from "../models";
import {Api} from "../api";
import './style.css';
import {findChampByShortName} from "../util";


@inject(Api)
export class Prettyresults {
  private api: Api;
  private draftCode: string;
  private champions: Champions;
  private draftState: DraftState;
  private ws: WebSocket;
  private votes: PhaseVote[];

  // note: all binds used to be interpolated function calls, but binding wouldnt update. using css is unreliable
  // just hacking this out for now with a bunch of observables. by binding child innerhtml we get updates.
  // insult to injury, if this was an array, updating subindices doesnt refresh bindings either. yeehaw
  redBan1: Champion;
  blueBan1: Champion;
  redBan2: Champion;
  blueBan2: Champion;
  redPick1: Champion;
  redPick2: Champion;
  redPick3: Champion;
  bluePick1: Champion;
  bluePick2: Champion;
  bluePick3: Champion;
  placeHolderChamp: Champion;

  constructor(api: Api) {
    this.api = api;
    this.draftState = null;

    this.placeHolderChamp = {
      displayName: '',
      name: '',
      asset:'champions/placeholder.jpg',
    }
  }

  activate(params, route) {
    this.draftCode = params.id;

    this.api.getChampions().then(c => {
      this.champions = c;
    }).then(() => {
      // get draft state after champions so that we can always resolve champ names
      this.api.getDraftState(this.draftCode).then(st => {
        this.draftState = st;
        this.votes = this.draftState && this.draftState.phases ? this.draftState.phases : [];
        this.update(false);
      });
    });

    this.ws = this.api.getWs(this.draftCode);
    this.ws.onmessage = this.onWsMessage.bind(this);
  }

  /* note: binding images is a huge pain in the ass thanks to webpack. everything that
  isnt statically referenced from css (the placeholder) is put in static and a simple
  url() bind is used.
   */

  // all vote nums come from UI 1 indexed

  private getVoteForIdx(voteNum : number, isBan : boolean) : PhaseVote | null {
    if (!this.votes) {
      return null;
    }

    let num  = 1;
    let foundVote = null;
    this.votes.forEach(v => {
      if (foundVote != null) {
        return;
      }

      if ((isBan && v.phaseType === PhaseType.ban) || (!isBan && v.phaseType === PhaseType.pick)) {
        if (num == voteNum) {
          foundVote = v;
        }
        num++;
      }
    });
    return foundVote;
  }

  private getChampForVote(isBlue : boolean, isBan: boolean, voteNum : number) : Champion | null {
    const v = this.getVoteForIdx(voteNum, isBan);
    if (v === null) {
      return this.placeHolderChamp;
    }

    const tryChamp = findChampByShortName(this.champions, isBlue ? v.voteBlueValue : v.voteRedValue);
    // note: rambda undefine bubbles up, make sure to colesc to null
    return tryChamp || this.placeHolderChamp;
  }

  private getImage(isBlue : boolean, isBan: boolean, voteNum : number) {
    const champ = this.getChampForVote(isBlue, isBan, voteNum);
    if (!champ) {
      return 'champions/placeholder.jpg';
    }

    return `champions/${champ.displayName}.jpg`;
  }

  private getName(isBlue : boolean, isBan: boolean, voteNum : number) {
    const champ = this.getChampForVote(isBlue, isBan, voteNum);
    if (champ === null) {
      return '';
    }

    return champ.displayName;
  }

  getBluePickImage(num : number) {
    return this.getImage(true, false, num);
  }

  getRedPickImage(num : number) {
    return this.getImage(false, false, num);
  }

  getBlueBanImage(num : number) {
    return this.getImage(true, true, num);
  }

  getRedBanImage(num :number) {
    return this.getImage(false, true, num);
  }

  getBluePickName(num :number) {
    return this.getName(true, false, num);
  }

  getRedPickName(num :number) {
    return this.getName( false, false, num);
  }

  getBlueBanName(num : number) {
    return this.getName(true, true, num);
  }

  getRedBanName(num : number) {
    return this.getName(false, true, num);
  }

  private onWsMessage(msgEvent: MessageEvent) {
    const mb: WsMsgBase = JSON.parse(msgEvent.data);

    // dont bother if we get a few w/s messages before draftstate is in
    if (this.draftState === null) {
      return;
    }

    if (mb.msgType == WebsocketMessageType.snapshot) {
      const ss: WsMsgSnapshot = <WsMsgSnapshot>mb;
      if (ss.phases) {
        this.votes = ss.phases;
        this.update(true);
      }
    }
  }

  private update(fromWs : boolean) {
    console.log(`update: fromWs=${fromWs} votes=`, this.votes);

    this.redBan1 = this.getChampForVote(false, true, 1);
    this.blueBan1 = this.getChampForVote(true, true, 1);
    this.redBan2 = this.getChampForVote(false, true, 2);
    this.blueBan2 = this.getChampForVote(true, true, 2);

    this.redPick1 = this.getChampForVote(false, false, 1);
    this.redPick2 = this.getChampForVote(false, false, 2);
    this.redPick3 = this.getChampForVote(false, false, 3);

    this.bluePick1 = this.getChampForVote(true, false, 1);
    this.bluePick2 = this.getChampForVote(true, false, 2);
    this.bluePick3 = this.getChampForVote(true, false, 3);
  }
}
