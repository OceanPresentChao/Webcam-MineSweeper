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
const isPredicting = ref(false)
const isReady = ref(false)
const isTrained = ref(false)
let isMouseDown = false
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
const { proxy } = getCurrentInstance()!
const emitter = proxy!.$mitt
emitter.on('gameStatusChange', (status) => {
  if (status && isTrained.value)
    startPredict()
  else if (!status)
    stopPredcit()
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

let lastTime = 0
function predict() {
  requestAnimationFrame(async (time) => {
    if (time - lastTime > 1000) {
      lastTime = time
      if (truncatedModel && sequentialModel && webcam) {
        const rawimg = await webcam.capture()
        const img = getProcessedImage(rawimg)
        if (img) {
          const classId = await predictImage(truncatedModel, sequentialModel, img)
          if (classId) {
            currentPredict.value = OperationLabel[classId!]
            emitter.emit('predict', classId)
          }
          else {
            console.warn('predict nothing')
          }
          img.dispose()
          await tf.nextFrame()
        }
        else {
          throw new Error('error when getting image')
        }
      }
    }
    if (isPredicting)
      requestAnimationFrame(predict)
  })
}

function startPredict() {
  trainSetting.value.status = 'predicting'
  isPredicting.value = true
  predict()
}

function stopPredcit() {
  trainSetting.value.status = 'stop'
  isPredicting.value = false
}

async function startTrain() {
  if (truncatedModel) {
    isPredicting.value = false
    modifySetting()
    sequentialModel = await trainModel(controllerDataset, truncatedModel, trainSetting.value)
    isTrained.value = true
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
    <div class="m-2">
      <video ref="videoRef" width="224" height="224" class="m-auto" />
      <div ref="novideoRef" style="display: none;">
        <p class="text-2xl">
          current browser doesn't support webcam
        </p>
      </div>
    </div>
    <div v-show="!isReady" class="text-center">
      <p class="text-xl">
        load model....
      </p>
    </div>
    <div v-show="isReady">
      <div>
        <p class="text-lg">
          Training Status:{{ trainSetting.status }}
        </p>
        <p class="text-lg">
          Current Predict:{{ currentPredict }}
        </p>
      </div>
      <div class="grid grid-cols-2">
        <label class="text-lg">Units</label>
        <input v-model="trainSetting.units" type="number">
        <label class="text-lg">LearningRate</label>
        <input v-model="trainSetting.learningRate" type="number">
        <label class="text-lg">BatchSize</label>
        <input v-model="trainSetting.batchSize" type="number">
        <label class="text-lg">Epochs</label>
        <input v-model="trainSetting.epochs" type="number">
      </div>

      <div class="grid grid-cols-2 justify-items-center my-2">
        <div>
          <button class="text-red-500" @click="startTrain">
            Train
          </button>
        </div>
        <div>
          <button v-if="!isPredicting" :disabled="!isTrained" class="text-blue-500" @click="startPredict">
            Predict
          </button>
          <button v-if="isPredicting" class="text-blue-500" @click="stopPredcit">
            Stop
          </button>
        </div>
      </div>
      <div>
        <div v-for="(val, key) in CLASSES" :key="key" class="text-yellow-500 m-2 grid grid-cols-2 justify-items-center">
          <!-- <label>{{ key }}</label> -->
          <!-- <canvas height="224" width="224" /> -->
          <button @mousedown="mouseDownHandler(key)" @mouseup="mouseUpHandler">
            Get {{ key }} Sample
          </button>
          <div>
            <label>count:</label>
            <label :id="`total${key}`">0</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input{
  padding: 0.25rem 0.5rem;
  margin: 0 0.25rem;
  border: 1px solid coral;
  border-radius: 0.5rem;
}

button{
  border: 1px currentColor solid;
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
}

button:disabled{
  cursor: no-drop;
  color:gray;
}
</style>
