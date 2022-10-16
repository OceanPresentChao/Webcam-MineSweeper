<script setup lang="ts">
import * as tf from '@tensorflow/tfjs'
import type { Ref } from 'vue'
import { ControllerDataset } from '@/utils/ControllerDataset'
import { OperationLabel } from '@/utils/type'
import type { Await } from '@/utils/type'
const videoRef = ref<HTMLVideoElement | null>(null)
const novideoRef = ref<HTMLDivElement | null>(null)
let webcam: Await<ReturnType<typeof tf.data.webcam>> | null = null
let truncatedModel: null | tf.LayersModel = null
let sequentialModel: null | tf.Sequential = null
let isPredicting = false
let isMouseDown = false
const isReady = ref(false)
const currentPredict = ref('')
const CLASSES = {
  up: {
    val: OperationLabel.UP,
    count: 0,
  },
  down: {
    val: OperationLabel.DOWN,
    count: 0,
  },
  left: {
    val: OperationLabel.LEFT,
    count: 0,
  },
  right: {
    val: OperationLabel.RIGHT,
    count: 0,
  },
  click: {
    val: OperationLabel.CLICK,
    count: 0,
  },
}
const NUM_CLASSES = Object.keys(CLASSES).length
const controllerDataset = new ControllerDataset(NUM_CLASSES)
const trainSetting = ref({
  units: 50,
  learningRate: 0.01,
  batchSize: 0.1,
  epochs: 20,
  status: '',
})
onMounted(async () => {
  try {
    if (videoRef.value) {
      webcam = await tf.data.webcam(videoRef.value)
      truncatedModel = await loadTruncatedMobileNet()
      isReady.value = true
      // Warm up the model. This uploads weights to the GPU and compiles the WebGL
      // programs so the first time we collect data from the webcam it will be
      // quick.
      const screenShot = await webcam.capture()
      truncatedModel.predict(screenShot.expandDims(0))
      screenShot.dispose()
    }
  }
  catch (e) {
    if (novideoRef.value)
      novideoRef.value.style.display = 'block'
    console.error(e)
  }
})

async function loadTruncatedMobileNet() {
  const mobilenet = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json')
  const layer = mobilenet.getLayer('conv_pw_13_relu')
  return tf.model({
    inputs: mobilenet.inputs,
    outputs: layer.output,
  })
}

async function getImage() {
  if (webcam) {
    const image = await webcam.capture()
    const processedImg = tf.tidy(() => image.expandDims(0).toFloat().div(127).sub(1))
    image.dispose()
    return processedImg
  }
}

async function train() {
  if (!controllerDataset.xs || !controllerDataset.ys)
    throw new Error('Add some examples before training!')
  if (!truncatedModel)
    throw new Error('truncatedModel not exist')
  // Creates a 2-layer fully connected model. By creating a separate model,
  // rather than adding layers to the mobilenet model, we "freeze" the weights
  // of the mobilenet model, and only train weights from the new model.
  sequentialModel = tf.sequential({
    layers: [
      // Flattens the input to a vector so we can use it in a dense layer. While
      // technically a layer, this only performs a reshape (and has no training
      // parameters).
      tf.layers.flatten({
        inputShape: truncatedModel.outputs[0].shape.slice(1),
      }),
      // Layer 1.
      tf.layers.dense({
        units: trainSetting.value.units,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        useBias: true,
      }),
      // Layer 2. The number of units of the last layer should correspond
      // to the number of classes we want to predict.
      tf.layers.dense({
        units: NUM_CLASSES,
        kernelInitializer: 'varianceScaling',
        useBias: false,
        activation: 'softmax',
      }),
    ],
  })

  // Creates the optimizers which drives training of the model.
  const optimizer = tf.train.adam(trainSetting.value.learningRate)
  // We use categoricalCrossentropy which is the loss function we use for
  // categorical classification which measures the error between our predicted
  // probability distribution over classes (probability that an input is of each
  // class), versus the label (100% probability in the true class)>
  sequentialModel.compile({ optimizer, loss: 'categoricalCrossentropy' })

  // We parameterize batch size as a fraction of the entire dataset because the
  // number of examples that are collected depends on how many examples the user
  // collects. This allows us to have a flexible batch size.
  const batchSize
      = Math.floor(controllerDataset.xs.shape[0] * trainSetting.value.batchSize)
  if (!(batchSize > 0)) {
    throw new Error(
      'Batch size is 0 or NaN. Please choose a non-zero fraction.')
  }

  // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
  sequentialModel.fit(controllerDataset.xs, controllerDataset.ys, {
    batchSize,
    epochs: trainSetting.value.epochs,
    callbacks: {
      onBatchEnd: async (batch, logs) => {
        trainSetting.value.status = `Loss: ${logs!.loss.toFixed(5)}`
      },
      onTrainBegin: () => {
        trainSetting.value.status = 'training'
      },
      onTrainEnd: () => {
        trainSetting.value.status = 'train finished'
      },
    },
  })
}

function predict() {
  requestAnimationFrame(async () => {
    if (truncatedModel && sequentialModel && isPredicting) {
      const img = await getImage()
      if (img) {
        const embeddings = truncatedModel.predict(img)
        const predictions = sequentialModel.predict(embeddings)
        if (predictions instanceof tf.Tensor) {
          const predictedClass = predictions.as1D().argMax()
          const classId = (await predictedClass.data())[0]
          currentPredict.value = OperationLabel[classId]
          img.dispose()
          await tf.nextFrame()
          requestAnimationFrame(predict)
        }
      }
      else {
        throw new Error('error when getting image')
      }
    }
  })
}

async function addExample(label: OperationLabel) {
  if (webcam && truncatedModel) {
    const image = await getImage()
    if (image) {
      const example = truncatedModel.predict(image)
      if (example instanceof tf.Tensor) {
        controllerDataset.addExample(example, label)
        image.dispose()
      }
    }
    else {
      throw new Error('error when getting image')
    }
  }
  else {
    throw new Error('model is not ready')
  }
}

function startPredict() {
  trainSetting.value.status = 'predicting'
  isPredicting = true
  predict()
}

async function startTrain() {
  isPredicting = false
  await train()
}

async function mouseDownHandler(key: keyof typeof CLASSES) {
  isMouseDown = true
  const labelRef = document.getElementById(`total${key}`)
  // eslint-disable-next-line no-unmodified-loop-condition
  while (isMouseDown) {
    await addExample(CLASSES[key].val)
    CLASSES[key].count++
    if (labelRef)
      labelRef.innerText = String(CLASSES[key].count)
    await tf.nextFrame()
  }
}

function mouseUpHandler() {
  isMouseDown = false
}
</script>

<template>
  <div>
    <div>
      <video ref="videoRef" width="224" height="224" />
      <div ref="novideoRef" style="display: none;">
        <p>
          current browser doesn't support webcam
        </p>
      </div>
    </div>
    <div v-show="!isReady">
      <p>
        load model....
      </p>
    </div>
    <div v-show="isReady">
      <div>
        <p>
          training status:{{ trainSetting.status }}
        </p>
        <p>
          current predict:{{ currentPredict }}
        </p>
      </div>
      <div>
        <label>units</label>
        <input v-model="trainSetting.units" type="number">
      </div>
      <div>
        <label>learningRate</label>
        <input v-model="trainSetting.learningRate" type="number">
      </div>
      <div>
        <label>batchSize</label>
        <input v-model="trainSetting.batchSize" type="number">
      </div>
      <div>
        <label>epochs</label>
        <input v-model="trainSetting.epochs" type="number">
      </div>
      <div>
        <button @click="startTrain">
          train
        </button>
        <button @click="startPredict">
          predict
        </button>
      </div>
      <div>
        <div v-for="(val, key) in CLASSES" :key="key">
          <!-- <label>{{ key }}</label> -->
          <!-- <canvas height="224" width="224" /> -->
          <label>count:</label>
          <label :id="`total${key}`">0</label>
          <button @mousedown="mouseDownHandler(key)" @mouseup="mouseUpHandler">
            click to get label {{ key }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
