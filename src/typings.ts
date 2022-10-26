export interface IOutput {
  data: { [index: string]: any };
  metadata: { [index: string]: any };
}

export interface IRender {
  render?(
    output: IOutput,
    element: HTMLDivElement,
    context: any
  ): Promise<void>;
}
