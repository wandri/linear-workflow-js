import {D3ZoomEvent, Selection, zoom, ZoomBehavior, zoomIdentity} from 'd3';
import {DiagramGridUtils, GRID_SIZE} from './utils/diagram-grid.utils';
import {GROUP_DISTANCE_BETWEEN, GROUP_WIDTH, NEW_GROUP_CONTAINER_WIDTH,} from './utils/diagram.constants';
import {Subject} from 'rxjs';
import {ManualZoomAction} from '../manual-zoom-action.enum';
import {DiagramActionType} from '../interface/diagram-action-type.enum';
import {DiagramGroupsAbstract} from './diagram-group/diagram-groups-abstract';
import {Step, StepGroup} from "../entities";

export abstract class DiagramAbstract<
  T extends StepGroup,
  U extends DiagramGroupsAbstract<T>
> {
  readonly actions$: Subject<{
    event: MouseEvent | D3ZoomEvent<SVGElement, null> | undefined;
    element: Step | T | undefined;
    eventType: DiagramActionType;
  }> = new Subject<{
    event: MouseEvent | D3ZoomEvent<SVGElement, null> | undefined;
    element: Step | T | undefined;
    eventType: DiagramActionType;
  }>();
  protected width = 0;
  protected height = 0;
  protected svg?: Selection<SVGElement, undefined, Element, undefined>;
  protected content?: Selection<SVGGElement, undefined, Element, undefined>;
  protected contentContainer?: Selection<
    SVGGElement,
    undefined,
    Element,
    undefined
  >;

  protected abstract diagramGroups: U;

  abstract createDiagramGroups(groups: T[]): U;

  init(
    width: number,
    height: number,
    wrapper: Selection<HTMLElement, undefined, Element, undefined>,
    groups: T[]
  ): void {
    this.width = width;
    this.height = height;
    if (wrapper) {
      this.svg = wrapper
        .append<SVGElement>('svg')
        .attr('viewBox', [0, 0, this.width, this.height])
        .attr('width', this.width)
        .attr('height', this.height);

      this.svg.append('defs');
      this.svg.on('click', (event: MouseEvent) =>
        this.sendClickOnGridAndStopPropagation(event)
      );
    }

    this.createGridAndGlobalZoom();
    this.createContentContainer(groups);
    this.update(groups, true, 0);
  }

  update(groups: T[], withZoom = false, animationDuration = 200): void {
    this.generateContent(groups);
    if (withZoom) {
      this.adjustZoomToView(groups, animationDuration);
    }
  }

  applyManualZoom(type: ManualZoomAction, groups: T[]): void {
    if (type === ManualZoomAction.ADJUST) {
      this.adjustZoomToView(groups);
    } else {
      let scale = 1;
      if (type === ManualZoomAction.OUT) {
        scale = 0.6;
      } else if (type === ManualZoomAction.IN) {
        scale = 1.75;
      }
      if (this.svg) {
        this.svg.transition().duration(200).call(this.d3Zoom().scaleBy, scale);
      }
    }
  }

  remove(): void {
    this.svg?.remove();
  }

  protected createGridAndGlobalZoom(): void {
    if (this.svg) {
      DiagramGridUtils.generatePattern(this.svg);
      this.svg.call(this.d3Zoom());
    }
  }

  protected createContentContainer(groups: T[]): void {
    if (this.svg) {
      const {k, x, y} = this.getZoomPosition(groups);
      this.contentContainer = this.svg
        .append<SVGGElement>('g')
        .attr('id', 'content-container')
        .attr('transform', `translate(${x},${y}) scale(${k})`);
    }
  }

  protected generateContent(groups: T[]): void {
    this.content?.remove();
    if (this.contentContainer) {
      this.content = this.contentContainer
        .append<SVGGElement>('g')
        .attr('id', 'content');

      // The order is important.
      // 1. define the groups,
      this.diagramGroups = this.createDiagramGroups(groups);
      // 2. then display the links to be always behind
      this.createLinksBetweenGroup(this.content);
      // 3. and after the groups.
      this.createGroups(this.content);
    }
  }

  protected abstract createGroups(
    content: Selection<SVGGElement, undefined, Element, undefined>
  ): void;

  protected createGroupsAndSteps(
    content: Selection<SVGGElement, undefined, Element, undefined>
  ): void {
    this.diagramGroups.createContainers(content);
    this.diagramGroups.createSelectionArea();
    this.diagramGroups.drawGroups();
    this.diagramGroups.drawSteps();
  }

  protected createLinksBetweenGroup(
    content: Selection<SVGGElement, undefined, Element, undefined>
  ): void {
    this.diagramGroups.createLinks(content);
  }

  protected sendClickOnGridAndStopPropagation(event: MouseEvent): void {
    this.actions$.next({
      element: undefined,
      eventType: DiagramActionType.CLICK_ON_GRID,
      event,
    });
    event.preventDefault();
  }

  protected abstract getZoomPositionPaddingRight(): number;

  private d3Zoom(): ZoomBehavior<SVGElement, undefined> {
    return zoom<SVGElement, undefined>()
      .scaleExtent([0.3, 0.8])
      .on('zoom', (event: D3ZoomEvent<SVGElement, null>) => {
        this.actions$.next({
          element: undefined,
          event,
          eventType: DiagramActionType.ZOOM,
        });
        if (this.contentContainer) {
          this.contentContainer.attr(
            'transform',
            `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`
          );
        }
        DiagramGridUtils.updateGridWithZoom(event.transform);
      });
  }

  private adjustZoomToView(groups: T[], duration = 200): void {
    if (groups.length > 0) {
      const {k, x, y} = this.getZoomPosition(groups);
      if (this.svg) {
        this.svg
          .transition()
          .duration(duration)
          .call(this.d3Zoom().transform, zoomIdentity.scale(k).translate(x, y));
      }
    }
  }

  private getZoomPosition(groups: T[]): {
    x: number;
    y: number;
    k: number;
  } {
    const DEFAULT_POSITION_X = GRID_SIZE * 2;
    const DEFAULT_POSITION_Y = GRID_SIZE * 4;

    const minPositionX = 0;
    const maxPositionX =
      groups.length * GROUP_WIDTH +
      (groups.length - 1) * GROUP_DISTANCE_BETWEEN +
      NEW_GROUP_CONTAINER_WIDTH;
    const maxGroupSize = Math.max(...groups.map((group) => group.getHeight()));
    const minPositionY = -maxGroupSize / 2;
    const maxPositionY = +maxGroupSize / 2;

    const kOnXAxis =
      this.width /
      (maxPositionX - minPositionX + this.getZoomPositionPaddingRight());
    const kOnYAxis =
      this.height / (maxPositionY - minPositionY + DEFAULT_POSITION_Y * 2);
    const k = Math.min(kOnXAxis, kOnYAxis, 0.7);
    const x = DEFAULT_POSITION_X - minPositionX;
    const y =
      this.height / 2 / k - (minPositionY + (maxPositionY - minPositionY) / 2);
    return {k, x, y};
  }
}
