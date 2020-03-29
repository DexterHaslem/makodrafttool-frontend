import {HttpClient, json} from 'aurelia-fetch-client';
import {inject} from 'aurelia-framework';

// !!buildurl
// TODO: make this more dynamic if a bother

// change this (eg, with a build step) to deployed location of API
// local go server
//const BASE_URL = 'http://localhost:8081/';
//const BASE_WS_URL = 'ws://localhost:8081/';

const BASE_URL = 'http://52.90.59.185:8081/';
const BASE_WS_URL = 'ws://52.90.59.185:8081/';

@inject(HttpClient)
export class Api {
  http: HttpClient;

  constructor(http) {
    this.http = http;
    http.configure(cfg =>
      cfg.withBaseUrl(BASE_URL)
    );
  }

  getURL(endpoint) {
    return `${BASE_URL}${endpoint}`;
  }

  createDraft(nd) {
    return this.http.fetch('newdraft',
      {
        method: 'post',
        body: json(nd)
      })
      .then(resp => resp.json())
      .catch(err => console.error(err));
  }

  getDraftState(sessionCode) {
    return this.http.fetch('draftState/' + sessionCode)
      .then(resp => resp.json())
      .catch(err => console.error(err));
  }

  getChampions() {
    return this.http.fetch('champions')
      .then(resp => resp.json())
      .catch(err => console.error(err));
  }

  getMaps() {
    return this.http.fetch('maps')
      .then(resp => resp.json())
      .catch(err => console.error(err));
  }

  getWs(sessionCode) {
    let ws = new WebSocket(BASE_WS_URL + "ws/" + sessionCode);
    return ws
  }
}
