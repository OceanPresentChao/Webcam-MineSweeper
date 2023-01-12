import * as tf from '@tensorflow/tfjs'
import type { TrainingSetting } from './type'
import type { ControllerDataset } from '@/utils/ControllerDataset'

// 在迁移学习的例子中将使用其中的卷积网络部分作为迁移学习的固定部分
export async function loadTruncatedMobileNet() {
  const mobilenet = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json')
  // 导出mobilenet 网络中间的卷积层输出
  const layer = mobilenet.getLayer('conv_pw_13_relu')
  // 使用导出的卷积层创建迁移学习神经网络的固定部分
  return tf.model({
    inputs: mobilenet.inputs,
    outputs: layer.output,
  })
}

export async function trainModel(controllerDataset: ControllerDataset, truncatedModel: tf.LayersModel, config: TrainingSetting) {
  if (!controllerDataset.xs || !controllerDataset.ys)
    throw new Error('Add some examples before training!')
  if (!truncatedModel)
    throw new Error('truncatedModel not exist')
  // Creates a 2-layer fully connected model. By creating a separate model,
  // rather than adding layers to the mobilenet model, we "freeze" the weights of the mobilenet model, and only train weights from the new model.
  // 创建一个2层的全联接网络。这里我们创建了新的网络，而不是在mobilenet里添加层，这样保证了mobilenet在整个训练过程中权重参数是固定不变的不受训练影响，而只训练新创建的2层全联接网络的权重参数
  const sequentialModel = tf.sequential({
    layers: [
      // Flattens the input to a vector so we can use it in a dense layer. While technically a layer, this only performs a reshape (and has no training  parameters).
      // 创建扁平化层，这层的功能是将输入的张量也就是mobilenet卷积层的输出扁平化为一个矢量。从技术角度来讲，这一层其实就是张量的一次变形，并没有任何计算以及网络权重参数{inputShape: [7, 7, 256]}
      tf.layers.flatten({
        inputShape: truncatedModel.outputs[0].shape.slice(1),
      }),
      tf.layers.dense({
        units: config.units,//定义神经元个数
        activation: 'relu',//定义激活函数为relu
        kernelInitializer: 'varianceScaling',//定义网络权重的初始化函数，使用varianceScaling来进行权重初始化
        useBias: true,// 网络带有偏置权重
      }),
      // Layer 2. The number of units of the last layer should correspond
      // to the number of classes we want to predict.
      tf.layers.dense({
        units: config.classnum,
        kernelInitializer: 'varianceScaling',
        useBias: false,
        activation: 'softmax',
      }),
    ],
  })
  // 创建优化器，用于驱动神经网络模型的训练。这里使用了基于自适应动量的参数优化算法，学习算法的学习率在网页上设置
  // Creates the optimizers which drives training of the model.
  const optimizer = tf.train.adam(config.learningRate)
  // We use categoricalCrossentropy which is the loss function we use for
  // categorical classification which measures the error between our predicted  probability distribution over classes (probability that an input is of each class), versus the label (100% probability in the true class)>
  // model.compile()方法用于在配置训练方法时，告知训练时用的优化器、损失函数和准确率评测标准
  sequentialModel.compile({ optimizer, loss: 'categoricalCrossentropy' })

  // We parameterize batch size as a fraction of the entire dataset because the number of examples that are collected depends on how many examples the user collects. This allows us to have a flexible batch size.
  const batchSize = Math.min(controllerDataset.xs.shape[0], config.batchSize)
  if (!(batchSize > 0)) {
    throw new Error(
      'Batch size is 0 or NaN. Please choose a non-zero fraction.')
  }

  // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
  // model.fit()方法用于执行训练过程
  sequentialModel.fit(controllerDataset.xs, controllerDataset.ys, {
    batchSize,//训练批次大小
    epochs: config.epochs,//训练的阶段数，也就是在一组数据上重复训练几次
    callbacks: {
      onBatchEnd: async (batch, logs) => {
        config.status = `Loss: ${logs!.loss.toFixed(5)}`
      },
      onTrainBegin: () => {
        config.status = 'training'
      },
      onTrainEnd: () => {
        config.status += ' train finished'
      },
    },
  })

  return sequentialModel
}

export function getProcessedImage(image: tf.Tensor3D) {
  // expandDim函数，在下标为n处添加一维
  // div除法操作
  const processedImg = tf.tidy(() => image.expandDims(0).toFloat().div(127).sub(1))
  image.dispose()
  return processedImg
}

export async function predictImage(truncatedModel: tf.LayersModel, sequentialModel: tf.Sequential, image: tf.Tensor) {
  // 使用mobilenet网络进行第一步预测, 获取mobilenet网络的卷积层激活函数的输出.
  const embeddings = truncatedModel.predict(image)
    // 使用新训练的迁移层对网络进行训练，使用mobilenet作为输入
  const predictions = sequentialModel.predict(embeddings)
  if (predictions instanceof tf.Tensor) {
    // 返回预测的手势中概率最大的那一个。对应来说就是网络识别后认为最可能的手势。
    const predictedClass = predictions.as1D().argMax()
    const classId = (await predictedClass.data())[0]//获取预测类别
    return classId
  }
}

