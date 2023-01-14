<script setup lang="ts">
interface MenuProps {
  cheat: boolean
  volume: number
}
const props = defineProps<MenuProps>()
const emits = defineEmits(['update:cheat', 'update:volume'])
const showMenu = ref(false)
</script>

<template>
  <div>
    <Teleport to="body">
      <div v-show="showMenu" class="mask" />
      <div
        class="fixed left-0 top-0 h-full"
        style="z-index: 2;"
        :style="{ width: showMenu ? '50%' : 'min-content' }"
      >
        <div
          v-show="!showMenu"
          class="h-16 w-16 bg-blue-500 cursor-pointer relative"
          style="border-radius: 50%;"
          @click="showMenu = true"
        >
          <Icon
            icon="mdi:tools" width="2rem" height="2rem"
            style="top:50%;left: 50%;position: absolute;transform: translate(-50%,-50%);"
          />
        </div>
        <div
          :style="{ width: showMenu ? '100%' : '0' }"
          style="transition: all cubic-bezier(0.075, 0.82, 0.165, 1) 1s;overflow: hidden;height:100%;"
          class="bg-red-100"
        >
          <div
            style="margin-left: auto;width: fit-content;cursor: pointer;"
            @click="showMenu = false"
          >
            <Icon icon="carbon:close" width="3rem" height="3rem" />
          </div>
          <div
            class="flex items-center justify-center flex-col text-2xl"
            style="height: 100%;"
          >
            <div>
              <label for="volume">Volume:</label>
              <input
                id="volume" type="range" :step="0.01" :min="0" :max="1"
                :value="volume"
                @change="emits('update:volume', $event.target!.value)"
              >
            </div>
            <div>
              <label for="cheat">Cheat:</label>
              <input
                id="cheat" type="checkbox"
                class="p-3 w-3 h-3 inline"
                :value="cheat"
                @change="emits('update:cheat', $event.target!.checked)"
              >
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.mask{
  height: 100%;
  width: 100%;
  position: fixed;
  top: 0;
  z-index: 1;
  background-color: #000;
  opacity: 0.5;
}
</style>
