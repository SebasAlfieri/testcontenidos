export type VideoAsset = {
  id: string;
  src: string;
  preloadTargets?: readonly number[];
};

export const VIDEO_ASSETS: readonly VideoAsset[] = [
  {
    id: "intro",
    src: "/QUBE_Hero_Desktop_compressed.mp4",
  },
  {
    id: "building",
    src: "/test.mp4",
    preloadTargets: [0, 2, 3, 4.5],
  },
];

export const introVideo = VIDEO_ASSETS[0]!;

export const buildingVideo = VIDEO_ASSETS[1]!;

export const FACADE_COUNT = 4;

export const buildingFacadeTimes = [0, 2, 4, 6] as const;
