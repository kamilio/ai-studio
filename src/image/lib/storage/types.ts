export interface ImageSession {
  id: string;
  title: string;
  /** Full prompt text as entered by the user. Optional for backward compat with existing stored sessions. */
  prompt?: string;
  createdAt: string;
}

export interface ImageGeneration {
  id: string;
  sessionId: string;
  stepId: number;
  prompt: string;
  createdAt: string;
}

export interface ImageItem {
  id: string;
  generationId: string;
  url: string;
  pinned: boolean;
  deleted: boolean;
  createdAt: string;
}

export interface ImageSettings {
  numImages: number;
}

export interface ImageStorageExport {
  sessions: ImageSession[];
  generations: ImageGeneration[];
  items: ImageItem[];
  settings: ImageSettings | null;
}
