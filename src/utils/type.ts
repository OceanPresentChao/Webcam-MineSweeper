export type Await<T> = T extends PromiseLike<infer U> ? U : T
export enum OperationLabel {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
  CLICK = 4,
}
