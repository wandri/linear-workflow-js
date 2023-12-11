import {StepWithAnchor} from "../../interface/step-with-anchor.class";

export type Direction = 'right' | 'left' | 'top' | 'bottom';
export type DirectionWithNone = Direction | 'none';
export const STEP_STROKE_DEFAULT_COLOR = '#969696';
export const STEP_STROKE_SELECTED_COLOR = '#0D99FF';

export const STEP_STROKE_OVER_COLOR = '#656565';
export const STEP_STROKE_OVER_ERROR_COLOR = '#f14141';
export const STEP_BACKGROUND_COLOR = '#fff';
export const STEP_HEIGHT = 80 * 2;
export const STEP_WIDTH = 120 * 2;
export const STEP_ANCHOR_ACTIVE = STEP_STROKE_SELECTED_COLOR;
export const STEP_ANCHOR_BACKGROUND = STEP_STROKE_SELECTED_COLOR;
export const STEP_RECT_SELECTOR = 'step-main-rect';
export const STEP_ANCHOR_CIRCLE_SELECTOR = 'step-anchor-circle';
export const STEP_ANCHOR_CONTAINER_SELECTOR = 'step-anchor-container';
export const STEP_ANCHOR_CROSS_SELECTOR = 'step-anchor-cross';
export const STEP_PADDING = 4 * 2;
export const STEP_IMAGE_SIZE = 14 * 2;
export const STEP_FONT_SIZE_MAIN_TEXT_CREATION = 12 * 2;
export const STEP_FONT_SIZE_MAIN_USER = 8 * 2;

export const STEP_ELEMENT_SELECTOR = 'step-selector'
export const STEP_AREA_SELECTOR = 'step-area-selector'

export class DiagramStepUtils {

  static getStepAnchor({x, y, anchor}: StepWithAnchor): { x: number; y: number } {
    let anchorX: number;
    let anchorY: number;
    if (anchor === 'right') {
      anchorX = x + STEP_WIDTH;
      anchorY = y + STEP_HEIGHT / 2;
    } else if (anchor === 'left') {
      anchorX = x;
      anchorY = y + STEP_HEIGHT / 2;
    } else if (anchor === 'top') {
      anchorX = x + STEP_WIDTH / 2;
      anchorY = y
    } else if (anchor === 'bottom') {
      anchorX = x + STEP_WIDTH / 2;
      anchorY = y + STEP_HEIGHT;
    } else {
      anchorX = x;
      anchorY = y;
    }

    return {x: anchorX, y: anchorY};
  }
}
