import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import { Widget } from '@lumino/widgets';

import { IRender } from './typings';
/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/vnd.jupyter.esm-rich-output';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-esm-rich-output';

/**
 * A widget for rendering ESM Rich Output.
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
   * Render ESM Rich Output into this widget's node.
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
 * A mime renderer factory for ESM Rich Output data.
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
      name: 'ESM Rich Output',
      mimeTypes: [MIME_TYPE],
      extensions: ['.esmrichoutput'],
    },
  ],
  documentWidgetFactoryOptions: {
    name: 'ESM Rich Output',
    primaryFileType: 'ESM Rich Output',
    fileTypes: ['ESM Rich Output'],
    defaultFor: ['ESM Rich Output'],
  },
};

export default extension;
