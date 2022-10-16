<script setup lang="ts">
import * as tf from '@tensorflow/tfjs'
import { ControllerDataset } from '@/utils/ControllerDataset'
import { getProcessedImage, loadTruncatedMobileNet, predictImage, trainModel } from '@/utils/TrainingModel'
import { OperationLabel } from '@/utils/type'
import type { TrainingSetting, Webcam } from '@/utils/type'
const videoRef = ref<HTMLVideoElement | null>(null)
const novideoRef = ref<HTMLDivElement | null>(null)
let webcam: Webcam | null = null
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
const trainSetting = ref<TrainingSetting>({
  units: 50,
  learningRate: 0.01,
  /** the number of samples in every training */
  batchSize: 10,
  /** the times of training */
  epochs: 20,
  classnum: Object.keys(CLASSES).length,
  status: '',
})
const controllerDataset = new ControllerDataset(trainSetting.value.classnum)
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

async function addExample(label: OperationLabel) {
  if (webcam && truncatedModel) {
    const rawImg = await webcam.capture()
    const image = getProcessedImage(rawImg)
    const example = truncatedModel.predict(image)
    if (example instanceof tf.Tensor) {
      controllerDataset.addExample(example, label)
      image.dispose()
    }
  }
  else {
    throw new Error('model is not ready')
  }
}

function predict() {
  requestAnimationFrame(async () => {
    if (truncatedModel && sequentialModel && isPredicting && webcam) {
      const rawimg = await webcam.capture()
      const img = getProcessedImage(rawimg)
      if (img) {
        const classId = await predictImage(truncatedModel, sequentialModel, img)
        currentPredict.value = OperationLabel[classId!]
        img.dispose()
        await tf.nextFrame()
        requestAnimationFrame(predict)
      }
      else {
        throw new Error('error when getting image')
      }
    }
  })
}

function startPredict() {
  trainSetting.value.status = 'predicting'
  isPredicting = true
  predict()
}

async function startTrain() {
  if (truncatedModel) {
    isPredicting = false
    modifySetting()
    sequentialModel = await trainModel(controllerDataset, truncatedModel, trainSetting.value)
  }
  else {
    throw new Error('model is not ready')
  }
}

function modifySetting() {
  trainSetting.value.units = Math.ceil(+trainSetting.value.units)
  trainSetting.value.learningRate = Math.abs(trainSetting.value.learningRate) > 1 ? 1 : Math.abs(trainSetting.value.learningRate)
  trainSetting.value.batchSize = Math.ceil(+trainSetting.value.batchSize)
  trainSetting.value.epochs = Math.ceil(+trainSetting.value.epochs)
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
