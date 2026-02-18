export interface ImageModelDef {
  id: string;
  label: string;
  supportsRemix: boolean;
  extraBody?: Record<string, unknown>;
}

export const IMAGE_MODELS: ImageModelDef[] = [
  {
    id: "Nano-Banana-Pro",
    label: "Nano Banana Pro",
    supportsRemix: true,
    extraBody: { image_only: true },
  },
  {
    id: "GPT-Image-1.5",
    label: "GPT Image 1.5",
    supportsRemix: true,
  },
  {
    id: "FLUX-2-Pro",
    label: "FLUX 2 Pro",
    supportsRemix: true,
  },
  {
    id: "FLUX-2-Flash",
    label: "FLUX 2 Flash",
    supportsRemix: false,
  },
  {
    id: "Grok-Imagine-Image",
    label: "Grok Imagine",
    supportsRemix: false,
  },
];
