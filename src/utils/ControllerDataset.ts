import * as tf from '@tensorflow/tfjs'
import type { OperationLabel } from '@/utils/type'
/**
 * A dataset for webcam controls which allows the user to add example Tensors
 * for particular labels. This object will concat them into two large xs and ys.
 * 创建用于存储迁移学习所需要的训练数据集
 * xs和ys用来存储样例的样本和标签
 */
export class ControllerDataset {
  numClasses: number
  xs: tf.Tensor<tf.Rank> | null
  ys: tf.Tensor<tf.Rank> | null
  constructor(numClasses: number) {
    this.numClasses = numClasses
    this.xs = null
    this.ys = null
  }

  /**
   * Adds an example to the controller dataset.
   * @param {Tensor} example A tensor representing the example. It can be an image,
   *     an activation, or any other type of Tensor.
   * @param {number} label The label of the example. Should be a number.
   */
  addExample(example: tf.Tensor, label: OperationLabel) {
    // One-hot encode the label.4
    // 执行给定的函数，即 fn，一旦它终止，它就会清除由指定函数 fn 分配的所有等距张量Tensors，但不包括 fn 返回的张量。
    const y = tf.tidy(() => tf.oneHot(tf.tensor1d([label]).toInt(), this.numClasses))

    if (this.xs === null || this.ys === null) {
      // For the first example that gets added, keep example and y so that the
      // ControllerDataset owns the memory of the inputs. This makes sure that
      // if addExample() is called in a tf.tidy(), these Tensors will not get
      // disposed.
      // keep函数存储的Tensor不会在tidy函数中清除
      this.xs = tf.keep(example)
      this.ys = tf.keep(y)
    }
    else {
      const oldX = this.xs
      this.xs = tf.keep(oldX.concat(example, 0))

      const oldY = this.ys
      this.ys = tf.keep(oldY.concat(y, 0))

      oldX.dispose()
      oldY.dispose()
      y.dispose()
    }
  }
}
