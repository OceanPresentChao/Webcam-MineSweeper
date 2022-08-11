<script setup lang="ts">
const props = defineProps({
  direction: String,
})
</script>

<template>
  <div class="panel-cell  mx-auto">
    <div class="thumb-box">
      <div class="thumb-box-outer">
        <div class="thumb-box-inner">
          <canvas class="thumb" width="224" height="224" />
        </div>
        <button class="record-button">
          <span>Add {{ props.direction }} Sample</span>
        </button>
      </div>
      <p>
        <span>0</span> examples
      </p>
    </div>
  </div><!-- ./panel-cell -->
</template>

<style scoped>
button:focus {
  outline: 0;
}

.panel-cell {
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-grow: 0;
  justify-content: center;
  position: relative;
}

.panel-cell p {
  color: #8b8b8b;
  font-size: 10px;
  margin: 0;
  padding: 0;
  text-align: center;
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

.panel-row-middle .panel-cell {
  height: 132px;
}

.thumb-box {
  display: inline-block;
}

.panel-row-middle .thumb-box {
  margin-top: 18px;
}

.thumb-box-outer {
  background: black;
  border: 1px solid #585858;
  border-radius: 4px;
  box-sizing: border-box;
  display: inline-block;
  padding: 9px;
  position: relative;
  transition: box-shadow 0.3s;
}

.thumb-box-inner {
  border: 1px solid #585858;
  border-radius: 4px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  overflow: hidden;
  width: 66px;
}

.thumb {
  height: 66px;
  transform: scaleX(-1);
}

.thumb-box-outer .record-button {
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
}

.thumb-box-outer .record-button span {
  background: #111;
  border: 1px solid #585858;
  border-radius: 3px;
  bottom: 9px;
  color: #f8f8f8;
  display: block;
  font-size: 8px;
  left: 9px;
  position: absolute;
  right: 9px;
  opacity: 0.5;
}
</style>
