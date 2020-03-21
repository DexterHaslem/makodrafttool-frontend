export class View {

  draftCode: string;

  activate(params) {
    this.draftCode = params.id;
  }
}
