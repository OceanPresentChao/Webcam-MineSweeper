import * as tf from '@tensorflow/tfjs'

let webcam: any = null
let truncatedMobileNet: any = null

async function loadTruncatedMobileNet() {
  const mobilenet = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json')

  // Return a model that outputs an internal activation.
  const layer = mobilenet.getLayer('conv_pw_13_relu')
  return tf.model({ inputs: mobilenet.inputs, outputs: layer.output })
}

export async function init(videoEl: HTMLVideoElement, errorEl: HTMLDivElement) {
  try {
    webcam = await tf.data.webcam(videoEl)
  }
  catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
    errorEl.style.display = 'block'
  }
  truncatedMobileNet = await loadTruncatedMobileNet()

  // Warm up the model. This uploads weights to the GPU and compiles the WebGL
  // programs so the first time we collect data from the webcam it will be
  // quick.
  const screenShot = await webcam.capture()
  truncatedMobileNet.predict(screenShot.expandDims(0))
  screenShot.dispose()
}
