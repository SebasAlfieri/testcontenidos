export type VideoAsset = {
  id: string;
  src: string;
};

export type CarouselSlide = {
  id: string;
  src: string;
  label: string;
  transitionSrc: string;
  transitionReverseSrc?: string;
};

export const CAROUSEL_SLIDES: readonly CarouselSlide[] = [
  {
    id: "slide-1",
    src: "/slides/slide-1.png",
    label: "Vista 1",
    transitionSrc: "/transitions/transicion-1.mp4",
    transitionReverseSrc: "/transitions/transicion-1-rev.mp4",
  },
  {
    id: "slide-2",
    src: "/slides/slide-2.png",
    label: "Vista 2",
    transitionSrc: "/transitions/transicion-2.mp4",
    transitionReverseSrc: "/transitions/transicion-2-rev.mp4",
  },
  {
    id: "slide-3",
    src: "/slides/slide-3.png",
    label: "Vista 3",
    transitionSrc: "/transitions/transicion-3.mp4",
    transitionReverseSrc: "/transitions/transicion-3-rev.mp4",
  },
  {
    id: "slide-4",
    src: "/slides/slide-4.png",
    label: "Vista 4",
    transitionSrc: "/transitions/transicion-4.mp4",
    transitionReverseSrc: "/transitions/transicion-4-rev.mp4",
  },
];

export const FACADE_COUNT = CAROUSEL_SLIDES.length;

export const introVideo: VideoAsset = {
  id: "intro",
  src: "/QUBE_Hero_Desktop_compressed.mp4",
};

export const VIDEO_ASSETS: readonly VideoAsset[] = [
  introVideo,
  ...CAROUSEL_SLIDES.flatMap((slide, i) => [
    { id: `transition-${i + 1}`, src: slide.transitionSrc },
    ...(slide.transitionReverseSrc
      ? [
          {
            id: `transition-${i + 1}-reverse`,
            src: slide.transitionReverseSrc,
          },
        ]
      : []),
  ]),
];

export function normalizeIndex(rawIndex: number) {
  return ((rawIndex % FACADE_COUNT) + FACADE_COUNT) % FACADE_COUNT;
}

export function transitionGap(fromIndex: number, toIndex: number) {
  const from = normalizeIndex(fromIndex);
  const to = normalizeIndex(toIndex);
  const forward = (to - from + FACADE_COUNT) % FACADE_COUNT;
  const backward = (from - to + FACADE_COUNT) % FACADE_COUNT;
  const direction = forward <= backward ? 1 : -1;
  // The video that separates slide k and slide k+1 lives on slide "k"
  // (transitionSrc). Going forward uses the departing slide; going
  // backward uses the transition that leads into the destination slide.
  const source = direction === 1 ? from : to;
  return { direction, slide: CAROUSEL_SLIDES[source]! } as const;
}