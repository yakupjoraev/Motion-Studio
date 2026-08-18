export { Carousel } from './carousel'
export { CarouselControls, type CarouselControlsProps } from './carousel-controls'
export { carouselDefinition } from './carousel.definition'
export { carouselMotion } from './carousel.motion'
export {
  AUTOPLAY_INTERVAL_STEP,
  MAX_AUTOPLAY_INTERVAL,
  MAX_PER_VIEW,
  MAX_SLIDES,
  MIN_AUTOPLAY_INTERVAL,
  MIN_PER_VIEW,
  MIN_SLIDES,
  carouselSchema,
  goToSlideLabel,
  lastIndex,
  nextIndex,
  slidePosition,
} from './carousel.schema'
export {
  CAROUSEL_DOT,
  CAROUSEL_SLIDE,
  CAROUSEL_TRACK,
  SLIDE_BASIS,
  carouselDotMarkStyles,
  carouselRootStyles,
} from './carousel.styles'
export type { CarouselProps } from './carousel.types'
export { useCarousel, type Carousel as CarouselApi, type CarouselOptions } from './use-carousel'
