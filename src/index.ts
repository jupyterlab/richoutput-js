import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import { Widget } from '@lumino/widgets';

import {IRender} from './typings';
/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/vnd.jupyter.es6-rich-output';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-es6-rich-output';

/**
 * A widget for rendering ES6 Rich Output.
 */
export class OutputWidget extends Widget implements IRenderMime.IRenderer {
  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
  }

  /**
   * Render ES6 Rich Output into this widget's node.
   */
  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const data = model.data[this._mimeType] as string;
    // Import module, call its render function
    console.log(model.data);
    console.log(`Rendering ${data}`);
    const module: IRender = await import(/* webpackIgnore: true */ data);
    const context = {};
    const div = document.createElement('div');
    this.node.appendChild(div);
    await module?.render(
      { data: model.data, metadata: model.metadata },
      div,
      context
    );
  }

  private _mimeType: string;
}

/**
 * A mime renderer factory for ES6 Rich Output data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: (options) => new OutputWidget(options),
};

/**
 * Extension definition.
 */
const extension: IRenderMime.IExtension = {
  id: 'richoutput-js:plugin',
  rendererFactory,
  rank: 100,
  dataType: 'string',
  fileTypes: [
    {
      name: 'ES6 Rich Output',
      mimeTypes: [MIME_TYPE],
      extensions: ['.es6richoutput'],
    },
  ],
  documentWidgetFactoryOptions: {
    name: 'ES6 Rich Output',
    primaryFileType: 'ES6 Rich Output',
    fileTypes: ['ES6 Rich Output'],
    defaultFor: ['ES6 Rich Output'],
  },
};

export default extension;
