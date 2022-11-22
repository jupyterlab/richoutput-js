import { CommChannel, ICommHost, IMessage } from './comm';
import { IContext, IModelState, IComms, JsonType, IComm } from './typings';
import { WidgetModels } from './widgets';
import { UUID } from '@lumino/coreutils';

export class RenderContext {
  constructor(
    private readonly models: WidgetModels,
    private readonly commHost?: ICommHost
  ) {}
  async getModelState(modelId: string): Promise<Map<string, IModelState>> {
    const result = new Map<string, IModelState>();
    for (const [id, model] of this.models.getModelAndAllReferencing(modelId)) {
      let comm;
      if (this.commHost) {
        comm = new CommChannel(id, this.commHost).getWrapper();
      }
      result.set(id, {
        modelModule: model.modelModule,
        modelName: model.modelName,
        modelModuleVersion: model.modelModuleVersion,
        state: model.getState(),
        comm,
      });
    }
    return result;
  }

  get comms(): IComms | undefined {
    if (!this.commHost) {
      return;
    }
    return new Comms(this.commHost).wrapper;
  }

  /**
   * Returns a wrapper object which hides the implementation details from
   * clients.
   */
  get wrapper(): IContext {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    return {
      getModelState: (modelId: string) => {
        return this.getModelState(modelId);
      },
      get comms(): IComms | undefined {
        return context.comms;
      },
    };
  }
}

class Comms {
  constructor(private readonly host: ICommHost) {}

  async open(
    targetName: string,
    data?: JsonType,
    buffers?: ArrayBuffer[]
  ): Promise<IComm> {
    const id = UUID.uuid4();

    const comm = new CommChannel(id, this.host);
    await comm.open(targetName, data, buffers);
    return comm.getWrapper();
  }

  registerTarget(
    targetName: string,
    callback: (comm: IComm, data?: JsonType, buffers?: ArrayBuffer[]) => void
  ): void {
    this.host.registerTarget(
      targetName,
      (commId: string, message: IMessage) => {
        const comm = new CommChannel(commId, this.host);
        callback(comm.getWrapper(), message.data, message.buffers);
      }
    );
  }

  get wrapper(): IComms {
    return {
      open: (
        targetName: string,
        data?: JsonType,
        buffers?: ArrayBuffer[]
      ): Promise<IComm> => {
        return this.open(targetName, data, buffers);
      },
      registerTarget: (
        targetName: string,
        callback: (comm: IComm) => void
      ): void => {
        this.registerTarget(targetName, callback);
      },
    };
  }
}
