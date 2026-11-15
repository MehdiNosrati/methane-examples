declare module 'jsdom' {
  export interface JsdomOptions {
    readonly url?: string;
  }

  export class JSDOM {
    readonly window: Window & typeof globalThis;
    constructor(html?: string, options?: JsdomOptions);
  }
}
