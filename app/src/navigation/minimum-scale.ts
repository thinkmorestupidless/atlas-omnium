// The finest scale a body is viewed at: its disc fills 90% of the viewport's shorter side. Below it
// there is no finer regime in 001, so scaling stops and the structural step is offered (FR-015a).

/** For a body whose radius the sources do not give: a viewing limit, not a measurement. */
export const MINIMUM_SCALE_WITHOUT_RADIUS = 1e3;

export const minimumScale = (radiusKm: number | null, viewportShortSidePx: number): number =>
  radiusKm === null ? MINIMUM_SCALE_WITHOUT_RADIUS : (2 * radiusKm * 1000) / (0.9 * viewportShortSidePx);
