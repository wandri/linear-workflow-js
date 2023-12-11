import {selectById} from "./utils/diagram.utils";

export class EntityDiagram {

  raise(id: string): void {
    selectById(id).raise();
  }
}
