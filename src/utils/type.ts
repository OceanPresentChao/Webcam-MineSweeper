import type * as tf from '@tensorflow/tfjs'
export type Await<T> = T extends PromiseLike<infer U> ? U : T

export enum OperationLabel {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
  CLICK = 4,
}

export interface TrainingSetting {
  units: number
  learningRate: number
  /** the number of samples in every training */
  batchSize: number
  /** the times of training */
  epochs: number
  classnum: number
  status: string
}

export type Webcam = Await<ReturnType<typeof tf.data.webcam>>

export enum GameStatus {
  WIN, LOSE, RUNNING, STOP,
}

export interface GameOptions {
  width?: number
  height?: number
  mine?: number
}
