import {inject} from 'aurelia-framework';
import {Champions, DraftState, PhaseVote, WebsocketMessageType, WsMsgBase} from "../models";
import {Api} from "../api";
import './style.css';


@inject(Api)
export class Prettyresults {
  private api: Api;
  private draftCode: string;
  private champions: Champions;
  private draftState: DraftState;
  private ws: WebSocket;

  banOverlayStyle: any;
  imageStyle: any;

  /* note: binding images is a huge pain in the ass thanks to webpack. everything that
  isnt statically referenced from css (the placeholder) is put in static and a simple
  url() bind is used.
   */

  getBluePickImage(num : number) {
    return 'champions/Rook.jpg';
  }

  getRedPickImage(num : number) {

  }

  getBlueBanImage(num : number) {

  }

  getRedBanImage(num :number) {

  }

  constructor(api: Api) {
    this.api = api;

    /* .pick-ban-overlay. make bound so we can dynamically change bg */
    this.banOverlayStyle = {
      height: '100%',
      width: '100%',
      'background-color': 'black',
      'background-size': 'cover',
      'background-position': 'center',
      'display': 'flex',
      'flex-direction': 'column',
      'transition': 'all 0.1s linear'
    };

    this.imageStyle = {
      position: 'relative',
      'margin-left': 'auto',
      'margin-right': 'auto',
      'background-position': 'center',
      'background-repeat': 'no-repeat',
      'background-size': '80%',
      'height': 0,
      'transition': 'all 0.1s linear',
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
        this.banOverlayStyle['background-image'] = `url('maps/${this.draftState.setup.mapName}.png')`;
      });
    });

    this.ws = this.api.getWs(this.draftCode);
    this.ws.onmessage = this.onWsMessage.bind(this);
  }

  private onWsMessage(msgEvent: MessageEvent) {
    let mb: WsMsgBase = JSON.parse(msgEvent.data);
    if (mb.msgType == WebsocketMessageType.snapshot) {

    }
  }

  private updateFrom(phases : PhaseVote[]) {

  }
}
