import { HttpClient, json } from 'aurelia-fetch-client';
import { inject } from 'aurelia-framework';

const BASE_URL = 'http://localhost:8081/';
const BASE_WS_URL = 'ws://localhost:8081/';


@inject(HttpClient)
export class Api {
  http: HttpClient;

  constructor(http) {
    this.http = http;
    http.configure(cfg =>
      cfg.withBaseUrl(BASE_URL)
    );
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

  getWs(sessionCode) {
    let ws = new WebSocket(BASE_WS_URL + "ws/" + sessionCode);
    return ws
  }
}
