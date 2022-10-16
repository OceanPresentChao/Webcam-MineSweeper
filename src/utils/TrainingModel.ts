import * as tf from '@tensorflow/tfjs'
import type { TrainingSetting } from './type'
import type { ControllerDataset } from '@/utils/ControllerDataset'

export async function loadTruncatedMobileNet() {
  const mobilenet = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json')
  const layer = mobilenet.getLayer('conv_pw_13_relu')
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
  // rather than adding layers to the mobilenet model, we "freeze" the weights
  // of the mobilenet model, and only train weights from the new model.
  const sequentialModel = tf.sequential({
    layers: [
      // Flattens the input to a vector so we can use it in a dense layer. While
      // technically a layer, this only performs a reshape (and has no training
      // parameters).
      tf.layers.flatten({
        inputShape: truncatedModel.outputs[0].shape.slice(1),
      }),
      tf.layers.dense({
        units: config.units,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        useBias: true,
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

  // Creates the optimizers which drives training of the model.
  const optimizer = tf.train.adam(config.learningRate)
  // We use categoricalCrossentropy which is the loss function we use for
  // categorical classification which measures the error between our predicted
  // probability distribution over classes (probability that an input is of each
  // class), versus the label (100% probability in the true class)>
  sequentialModel.compile({ optimizer, loss: 'categoricalCrossentropy' })

  // We parameterize batch size as a fraction of the entire dataset because the
  // number of examples that are collected depends on how many examples the user
  // collects. This allows us to have a flexible batch size.
  const batchSize = Math.floor(controllerDataset.xs.shape[0] * config.batchSize)
  if (!(batchSize > 0)) {
    throw new Error(
      'Batch size is 0 or NaN. Please choose a non-zero fraction.')
  }

  // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
  sequentialModel.fit(controllerDataset.xs, controllerDataset.ys, {
    batchSize,
    epochs: config.epochs,
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
  const processedImg = tf.tidy(() => image.expandDims(0).toFloat().div(127).sub(1))
  image.dispose()
  return processedImg
}

export async function predictImage(truncatedModel: tf.LayersModel, sequentialModel: tf.Sequential, image: tf.Tensor) {
  const embeddings = truncatedModel.predict(image)
  const predictions = sequentialModel.predict(embeddings)
  if (predictions instanceof tf.Tensor) {
    const predictedClass = predictions.as1D().argMax()
    const classId = (await predictedClass.data())[0]
    return classId
  }
}

