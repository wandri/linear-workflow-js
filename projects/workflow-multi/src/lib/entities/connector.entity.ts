import {createId} from "@paralleldrive/cuid2";

export class Connector {
  id: string;
  startId: string;
  endId: string;

  constructor(startId: string, endId: string, id?: string) {
    this.id = id ?? createId();
    this.startId = startId;
    this.endId = endId;
  }
}
