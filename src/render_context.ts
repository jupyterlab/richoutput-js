import { CommChannel, CommHost } from './comm';
import { Context, ModelState } from './typings';
import { WidgetModels } from './widgets';

export class RenderContext implements Context {
  constructor(private readonly models: WidgetModels, private readonly commHost?: CommHost) {

  }
  async getModelState(modelId: string): Promise<Map<string, ModelState>> {
    const result = new Map<string, ModelState>();
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
      })
    }
    return result;
  }
}
