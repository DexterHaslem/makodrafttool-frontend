import {inject} from 'aurelia-framework';
import {Api} from '../api';
import {Draft} from 'models';

@inject(Api)
export class Admin {
  api: Api;
  draft: Draft;
  draftCreated: boolean;

  constructor(api) {
    this.api = api;
  }

  onCreate() {
    let d = this.api.createDraft(this.draft);
    d.then(v => {
      this.draftCreated = true;
      this.draft = v;
    });
  }

  getLink(v) {
    /* TODO: figure out way to do this proper from router */
    return "#/v/" + v;
  }
}
