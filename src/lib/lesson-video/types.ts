export type SlideKind = "markdown" | "pdf";

export type SlideVisual =
  | { type: "text"; markdown: string }
  | { type: "image"; src: string; alt: string };

export interface Slide {
  id: string;
  kind: SlideKind;
  title?: string;
  /** Plain text for TTS narration. */
  bodyText: string;
  visual: SlideVisual;
  sourceResourceId: string;
}

export interface SlideDeck {
  slides: Slide[];
  estimatedMinutes: number;
}
