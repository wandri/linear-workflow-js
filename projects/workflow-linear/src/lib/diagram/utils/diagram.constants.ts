import {GRID_SIZE} from './diagram-grid.utils';
import {symbol, symbolCross} from 'd3';

export type Direction = 'right' | 'left' | 'top' | 'bottom';
export type DirectionWithNone = Direction | 'none';

// COLORS
export const GROUP_DEFAULT_BACKGROUND_COLOR = 'rgba(213,210,205,0.3)';
export const GROUP_OVER_BACKGROUND_COLOR = 'rgba(255,242,192,0.3)';
export const GROUP_DRAG_BACKGROUND_COLOR = '#FCF4E9';
export const GROUP_CREATE_STEP_BUTTON_OVER_COLOR = 'rgba(218,218,218,0.56)';
export const GROUP_CREATE_STEP_BUTTON_DEFAULT_COLOR = 'transparent';
export const GROUP_CREATE_STEP_BUTTON_DOWN_COLOR = 'rgba(218,218,218,0.34)';
export const GROUP_DRAG_PLACEHOLDER_BACKGROUND_COLOR = 'rgba(175,175,175,0.32)';
export const STEP_DEFAULT_BACKGROUND_COLOR = `#fff`;
export const STEP_STROKE_DEFAULT_COLOR = 'transparent';
export const SELECTED_COLOR = '#0D99FF';

export const STEP_STROKE_SELECTED_COLOR = SELECTED_COLOR;

export const STEP_STROKE_OVER_COLOR = '#cccccc';
export const STEP_DRAG_BACKGROUND_COLOR = '#fcfeff';

export const GROUP_CREATION_OVER_COLOR = '#838383';
export const GROUP_CREATION_DEFAULT_COLOR = '#cccccc';
export const STEP_DRAG_PLACEHOLDER_BACKGROUND_COLOR =
  GROUP_DRAG_PLACEHOLDER_BACKGROUND_COLOR;
export const STEP_NO_INFO_COLOR = '#f3f3f3';
export const LINK_COLOR = '#2a2a2a';

// PROPERTIES
export const STEP_DEFAULT_HEIGHT = 100 * 2;
export const STEP_STATUS_RADIUS = 30;
export const STEP_NAME_HEIGHT = 30;
export const STEP_USER_RADIUS = 18;
export const STEP_WIDTH = 160 * 2;
export const STEP_PADDING = GRID_SIZE;
export const GROUP_PADDING = GRID_SIZE;
export const GROUP_FONT_SIZE_MAIN_TEXT_CREATION = 12 * 2;
export const GROUP_WIDTH = STEP_WIDTH + GROUP_PADDING * 2;
export const GROUP_PADDING_TOP = GRID_SIZE * 4;
export const GROUP_PADDING_BOTTOM = GRID_SIZE * 4;

export const GROUP_DISTANCE_BETWEEN = GRID_SIZE * 4;
export const NEW_GROUP_CONTAINER_WIDTH = GRID_SIZE * 6;
export const STEP_DISTANCE_BETWEEN = GRID_SIZE * 2;
export const STEP_FONT_SIZE_MAIN_USER = 8 * 2;
export const STEP_ANCHOR_ACTIVE = STEP_STROKE_SELECTED_COLOR;
export const STEP_ANCHOR_BACKGROUND = STEP_STROKE_SELECTED_COLOR;

export const STEP_IMAGE_SIZE = 14 * 2;
export const STEP_FONT_SIZE_MAIN_TEXT_CREATION = 12 * 2;
export const STEP_FONT_SIZE_STEP_CREATION_BUTTON = 10 * 2;

export const PATH_CROSS = symbol().type(symbolCross);

// SELECTORS
export const GROUP_RECT_SELECTOR = 'step-main-rect';
export const STEPS_CONTAINER_SELECTOR = 'steps-container';
export const GROUP_CREATION_BUTTON_SELECTOR = 'creation-group-icon-selector';
export const STEP_CONTAINER_SELECTOR = 'step-container';
export const CREATION_GROUP_CROSS_SELECTOR = 'creation-group-cross-selector';
export const CREATION_GROUP_LINK_SELECTOR = 'creation-group-link-selector';
export const CREATION_GROUP_CIRCLE_SELECTOR = 'creation-group-circle-selector';
export const GROUP_CONTAINER_SELECTOR = `group-container`;
export const GROUPS_CONTAINER_SELECTOR = `groups-container`;
export const GROUP_CREATION_CONTAINER_SELECTOR = `group-creation-container`;
export const GROUP_PLACEHOLDER_SELECTOR = `group-placeholder`;
export const STEP_PLACEHOLDER_SELECTOR = `step-placeholder`;
export const STEP_RECT_SELECTOR = 'step-rect';

export const GROUP_ELEMENT_SELECTOR = 'group-selector';
export const GROUP_AREA_SELECTOR = 'group-area-selector';
export const LINKS_CONTAINER_SELECTOR = 'links-container';
export const CREATE_STEP_BUTTON_CONTAINER_SELECTOR =
  'create-step-button-container';
