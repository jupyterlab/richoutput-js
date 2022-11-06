export class WidgetModels {
  private readonly models = new Map<string, WidgetModel>();

  getModelAndAllReferencing(modelId: string): Map<string, WidgetModel> {
    const result = new Map<string, WidgetModel>();

    const model = this.models.get(modelId);
    if (model) {
      result.set(modelId, model);
    }
    return result;
  }

  onCommOpen(commId: string, data: WidgetCommData, buffers: ArrayBuffer[] | undefined) {
    const state = data['state'] || {};
    const modelModule = state['_model_module'] as string;
    const modelName = state['_model_name'] as string;
    let bufferData = undefined;
    if (buffers) {
      const bufferPaths = data['buffer_paths'] || [];
      bufferData = { buffers, bufferPaths };
    }
    this.addModel(commId, modelModule, modelName, state, bufferData);
  }

  private addModel(
    modelId: string, modelModule: string, modelName: string,
    state: { [key: string]: unknown }, bufferData: BufferData | undefined) {
    const model = new WidgetModel(modelId, modelModule, modelName, state, bufferData);
    this.models.set(modelId, model);
  }

  onCommMessage(
    commId: string, data: WidgetCommData, buffers: ArrayBuffer[] | undefined) {
    const model = this.models.get(commId);
    if (model) {
      const state = data['state'] || {};
      let bufferData = undefined;
      if (buffers) {
        const bufferPaths = data['buffer_paths'] || [];
        bufferData = { buffers, bufferPaths };
      }
      model.updateState(state, bufferData);
    }
  }

  onCommClose(commId: string) {
    this.models.delete(commId);
  }
  reset() {
    this.models.clear();
  }
}

export declare interface WidgetCommData {
  state: { [key: string]: unknown };
  buffer_paths: string[][];
}

/** Data stored in the model buffer. */
export interface BufferData {
  readonly buffers: ArrayBuffer[];
  readonly bufferPaths: string[][];
}


class WidgetModel extends EventTarget {
  private state: { [key: string]: unknown };
  readonly modelModuleVersion?: string;

  constructor(
    private readonly commId: string,
    readonly modelModule: string,
    readonly modelName: string,
    state: { [key: string]: unknown },
    private buffers: BufferData | undefined,
  ) {
    super();

    /**
     * State must always be JSON serializable since it came over a comm channel.
     * At this level, it's just a dictionary of key-value pairs that gets
     * combined to represent the current values of the widget model.
     */
    this.state = Object.assign({}, state);
    this.modelModuleVersion =
      this.state['_model_module_version'] as (string | undefined);
  }

  updateState(state: { [key: string]: unknown }, buffers: BufferData | undefined) {
    // The state is just a dictionary of key-value pairs with new state
    // messages being deltas to previous states.
    this.state = Object.assign(this.state, state);

    if (buffers) {
      this.buffers = buffers;
    }
  }

  getState(): { [key: string]: unknown } {
    return this.state;
  }

  getBuffers(): BufferData | void {
    return this.buffers;
  }

  getCommId(): string {
    return this.commId;
  }
}


