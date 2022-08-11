<script setup lang="ts">
const learningRateOptions = [0.00001, 0.0001, 0.01, 0.03]
const batchSizeOptions = [0.05, 0.1, 0.4, 1]
const epochOptions = [10, 20, 40]
const unitOptions = [10, 100, 200]
const trainingConfig = ref({
  learningRate: 0.0001,
  batchSize: 0.4,
  epoch: 20,
  unit: 100,
})
const directions = {
  up: 'up',
  left: 'left',
  right: 'right',
  down: 'down',
}
</script>

<template>
  <div>
    <div id="status">
      Loading mobilenet...
    </div>

    <div id="controller" class="controller-panels">
      <div class="panel training-panel">
        <!-- Big buttons. -->
        <div class="panel-row big-buttons">
          <button id="train">
            <img width="66" height="66" src="../assets/button.svg">
            <span id="train-status">TRAIN MODEL</span>
          </button>
          <button id="predict">
            <img width="66" height="66" src="../assets/button.svg">
            <span>PLAY</span>
          </button>
        </div><!-- /.panel-row -->

        <div class="panel-row params-webcam-row">
          <!-- Hyper params. -->
          <div class="hyper-params">
            <!-- Learning rate -->
            <div class="dropdown">
              <label>Learning rate</label>
              <div class="select">
                <select id="learningRate" v-model="trainingConfig.learningRate">
                  <option
                    v-for="item in learningRateOptions" :key="item" :value="item"
                  >
                    {{ item }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Batch size -->
            <div class="dropdown">
              <label>Batch size</label>
              <div class="select">
                <select
                  id="batchSizeFraction"
                  v-model="trainingConfig.batchSize"
                >
                  <option
                    v-for="item in batchSizeOptions" :key="item" :value="item"
                  >
                    {{ item }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Epochs -->
            <div class="dropdown">
              <label>Epochs</label>
              <div class="select">
                <select
                  id="epochs"
                  v-model="trainingConfig.epoch"
                >
                  <option
                    v-for="item in epochOptions" :key="item" :value="item"
                  >
                    {{ item }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Hidden units -->
            <div class="dropdown">
              <label>Hidden units</label>
              <div class="select">
                <select
                  id="dense-units"
                  v-model="trainingConfig.unit"
                >
                  <option
                    v-for="item in unitOptions" :key="item" :value="item"
                  >
                    {{ item }}
                  </option>
                </select>
              </div>
            </div>
          </div><!-- /.hyper-params -->

          <div class="webcam-box-outer">
            <div class="webcam-box-inner">
              <video id="webcam" autoplay playsinline muted width="224" height="224" />
            </div>
          </div>
        </div><!-- /.panel-row -->
      </div><!-- /.panel -->

      <div class="panel joystick-panel">
        <div class="panel-row panel-row-top">
          <ThumbBox :direction="directions.up" />
        </div><!-- /.panel-row -->
        <div class="panel-row panel-row-middle">
          <ThumbBox :direction="directions.left" />
          <div class="panel-cell panel-cell-center panel-cell-fill">
            <img height="108" width="129" src="../assets/joystick.png">
          </div><!-- ./panel-cell -->
          <ThumbBox :direction="directions.right" />
        </div><!-- /.panel-row -->
        <div class="panel-row panel-row-bottom">
          <ThumbBox :direction="directions.down" />
        </div><!-- /.panel-row -->
      </div><!-- /.panel -->
    </div><!-- /#controller -->
  </div>
</template>

<style scoped>
html,
body {
  background: #2a2a2a;
  font-family: 'Roboto', sans-serif;
  margin: 0;
  padding: 0;
}

body {
  display: flex;
  flex-direction: column;
}

button:focus {
  outline: 0;
}

/** Page header. **/
header {
  background-color: #ef6c00;
  border-bottom: solid 1px rgba(0, 0, 0, 0.4);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.7);
  font-size: 30px;
  font-weight: 300;
  line-height: 1.45em;
  overflow: hidden;
  padding: 20px 0;
  position: relative;
  text-align: center;
  -webkit-font-smoothing: antialiased;
}

header b {
  color: rgba(255, 255, 255, 1);
  font-weight: 400;
}

/** Loading message. */
#status {
  font-weight: 300;
  margin: 12px 0;
  text-align: center;
}

/* Rules for the pacman game. */
#pacman-container {
  background: black;
  padding: 25px 0 40px;
}

#logo {
  background: url('https://storage.googleapis.com/tfjs-examples/assets/webcam-transfer-learning/bck.png');
  background-repeat: no-repeat;
  background-position-y: -5px;
  margin: 0 auto;
  position: relative;
  transform: scale(1.2);
  width: 554px;
}

#logo #pcm-c {
  border-top: none;
  margin: 0 auto;
  position: relative;
  top: 20px;
}

#logo-l {
  background: #990;
  display: none;
  height: 2px;
  left: 177px;
  overflow: hidden;
  position: absolute;
  top: 157px;
  width: 200px;
}

#logo-b {
  background: #ff0;
  height: 8px;
  left: 0;
  position: absolute;
  width: 0;
}

/** Controls. **/
.controller-panels {
  display: flex;
  flex-direction: row;
  margin: 9px auto 0;
}

.panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-shrink: 0;
}

.panel:first-child {
  border-right: 1px dashed #565656;
  padding: 0 22px 0 13px;
  width: 396px;
}

.panel:last-child {
  padding: 0 9px 0 22px;
  width: 353px;
}

.panel-row {
  display: flex;
  flex-direction: row;
}

.panel-cell {
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-grow: 0;
  justify-content: center;
  position: relative;
}

.panel-cell-fill {
  flex-grow: 1;
}

.panel-cell p {
  color: #8b8b8b;
  font-size: 10px;
  margin: 0;
  padding: 0;
  text-align: center;
}

.controller-panels button {
  background: none;
  border: none;
  box-sizing: border-box;
  cursor: pointer;
  margin: 0;
  padding: 0;
}

#train-status {
  width: 124px;
}

/** Training panel. **/
.big-buttons {
  justify-content: space-between;
}

.big-buttons button {
  align-items: center;
  display: flex;
  flex-direction: row;
}

.big-buttons button span {
  border-bottom: 2px solid #484848;
  border-top: 2px solid #484848;
  color: #aaa;
  display: inline-block;
  font-size: 18px;
  font-weight: 500;
  padding: 9px 11px;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.params-webcam-row {
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 35px;
}

.webcam-box-outer {
  background: black;
  border: 1px solid #585858;
  border-radius: 4px;
  box-sizing: border-box;
  display: inline-block;
  padding: 9px;
}

.webcam-box-inner {
  border: 1px solid #585858;
  border-radius: 4px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  overflow: hidden;
  width: 160px;
}

#webcam {
  height: 160px;
  transform: scaleX(-1);
}

.hyper-params {
  display: flex;
  flex-direction: column;
  margin-left: 12px;
}

.dropdown {
  flex-direction: column;
  width: 110px;
  margin-bottom: 10px;
}

.dropdown label {
  color: #777;
  font-size: 11px;
  display: block;
  font-weight: 300;
  line-height: 1;
}

.dropdown .select {
  position: relative;
}

.dropdown .select select {
  -webkit-appearance: none;
  -moz-appearance: none;
  background: none;
  border: none;
  border-bottom: solid 1px #313131;
  border-radius: 0;
  color: #c9c9c9;
  display: block;
  font-size: 12px;
  outline: none;
  padding: 6px 0;
  width: 100%;
}

.dropdown .select::after {
  content: "▽";
  color: #999;
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 18px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  position: absolute;
  right: 0;
  top: 6px;
  pointer-events: none;
}

/** Joystick panel. **/
.joystick-panel {
  margin-top: 13px;
}

.panel-cell .help-text {
  font-size: 10px;
  font-style: italic;
  left: 0;
  line-height: 1.1;
  margin: 0;
  padding: 0;
  text-align: left;
  top: 0;
  position: absolute;
}

.panel-row-top .panel-cell-left {
  background: url("../assets/pointer.svg");
  background-repeat: no-repeat;
  background-size: 38%;
  background-position: 98% 46%;
}

.panel-row-middle .panel-cell {
  height: 132px;
}

.panel-row-middle .thumb-box {
  margin-top: 18px;
}

/** Footer. **/
#copyright {
  color: #f8f8f8;
  font-weight: 300;
  margin: 12px 0;
  text-align: center;
}

#no-webcam {
  display: none;
  text-align: center;
  font-size: 30px;
  color: white;
  padding: 30px;
  line-height: 30px;
}
</style>
