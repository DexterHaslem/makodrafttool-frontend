import {bindable} from 'aurelia-framework';
import {
  Champion,
  Champions,
  DraftState,
  PhaseType,
  PhaseVote,
} from "../models";

import './style.css';
import {findChampByShortName} from "../util";


export class PrettyResults {
  @bindable() public champions: Champions;
  @bindable() public draftState: DraftState;
  @bindable() public votes: PhaseVote[];

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
  readonly placeHolderChamp: Champion;

  constructor() {
    this.placeHolderChamp = {
      displayName: '',
      name: '',
      asset: 'champions/placeholder.jpg',
    };

    this.redBan1 = this.redBan2 = this.blueBan1 = this.blueBan2 = this.placeHolderChamp;
    this.redPick1 = this.redPick2 = this.redPick3 = this.placeHolderChamp;
    this.bluePick1 = this.bluePick2 = this.bluePick3 = this.placeHolderChamp;
    //this.update();
  }

  public activate() {
    console.log('pretty-results activated', this.champions, this.draftState);
  }

  public attached() {
    //console.log('attached:', this.champions, this.draftState, this.votes);
    // update right away to get rid of all our undefined values
    //this.update();
  }
  /* note: binding images is a huge pain in the ass thanks to webpack. everything that
  isnt statically referenced from css (the placeholder) is put in static and a simple
  url() bind is used.
   */

  // all vote nums come from UI 1 indexed

  private getVoteForIdx(voteNum: number, isBan: boolean): PhaseVote | null {
    if (!this.votes) {
      return null;
    }

    let num = 1;
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

  private getChampForVote(isBlue: boolean, isBan: boolean, voteNum: number): Champion | null {
    const v = this.getVoteForIdx(voteNum, isBan);
    if (!v) {
      return this.placeHolderChamp;
    }

    const tryChamp = findChampByShortName(this.champions, isBlue ? v.voteBlueValue : v.voteRedValue);
    // note: rambda undefine bubbles up, make sure to colesc to null
    return tryChamp || this.placeHolderChamp;
  }

  public update() {
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
