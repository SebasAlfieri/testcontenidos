export type Slide = {
  id: string;
  src: string;
  label: string;
};

export const SLIDES: readonly Slide[] = [
  { id: "slide-1", src: "/slides/slide-1.png", label: "Vista 1" },
  { id: "slide-2", src: "/slides/slide-2.png", label: "Vista 2" },
  { id: "slide-3", src: "/slides/slide-3.png", label: "Vista 3" },
  { id: "slide-4", src: "/slides/slide-4.png", label: "Vista 4" },
];
