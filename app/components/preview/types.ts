/**
 * Preview component types
 */

export interface PreviewSettings {
  [key: string]: string | number | boolean;
}

export interface PreviewMessage {
  type: 'RENDER' | 'RENDER_ERROR' | 'RESIZE';
  html?: string;
  css?: string;
  error?: string;
  height?: number;
}

export interface PreviewState {
  isLoading: boolean;
  error: string | null;
  lastRenderTime: number;
}

export type DeviceSize = 'mobile' | 'tablet' | 'desktop';

export const DEVICE_WIDTHS: Record<DeviceSize, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1200
};

// Element targeting types
export interface SelectedElementInfo {
  selector: string;
  tagName: string;
  className: string;
  textContent: string;
  boundingRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  path: string[];
}

// Messages for element targeting (iframe <-> parent)
export interface ElementSelectedMessage {
  type: 'ELEMENT_SELECTED';
  nonce: string;
  element: SelectedElementInfo;
}

export interface ElementHoverMessage {
  type: 'ELEMENT_HOVER';
  nonce: string;
  element: {
    selector: string;
    boundingRect: {
      top: number;
      left: number;
      width: number;
      height: number;
    };
  } | null;
}

export interface EnableTargetingMessage {
  type: 'ENABLE_TARGETING';
  nonce: string;
  enabled: boolean;
}

export interface HighlightElementMessage {
  type: 'HIGHLIGHT_ELEMENT';
  nonce: string;
  selector: string | null;
}

export interface ClearSelectionMessage {
  type: 'CLEAR_SELECTION';
  nonce: string;
}

export type TargetingMessage =
  | ElementSelectedMessage
  | ElementHoverMessage
  | EnableTargetingMessage
  | HighlightElementMessage
  | ClearSelectionMessage;
