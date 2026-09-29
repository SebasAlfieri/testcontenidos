export type Slide = {
  id: string;
  src: string;
  label: string;
};

export const SLIDES: readonly Slide[] = [
  { id: "clasica", src: "/ziba/individual-clasica.jpg", label: "Clásica" },
  { id: "crema", src: "/ziba/individual-crema.jpg", label: "Crema" },
  { id: "mostaza", src: "/ziba/individual-mostaza.jpg", label: "Mostaza" },
];
