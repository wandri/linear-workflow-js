import {Direction, DirectionWithNone} from "../diagram/utils/diagram-step.utils";
import {Step} from "../entities";

export interface ConnectorCreationDetail {
  step?: Step,
  positionOnStep: DirectionWithNone | Direction
}
