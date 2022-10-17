<script setup lang="ts">
import type { GameBlock } from '@/utils/GameBlock'
const props = defineProps<{ block: GameBlock; isCheat: boolean }>()
const emits = defineEmits(['lrclick', 'lclick', 'rclick'])
const blockColors = [
  'text-transparent',
  'text-blue-500',
  'text-green-500',
  'text-yellow-500',
  'text-orange-500',
  'text-red-500',
  'text-purple-500',
  'text-pink-500',
  'text-teal-500',
]

function getMineClass(block: GameBlock) {
  if (block.isFlag)
    return 'bg-gray-500/10'
  if (!block.isOpen)
    return 'bg-gray-500/10 hover:bg-gray-500/20'
  return block.isMine
    ? 'bg-red-500/50'
    : blockColors[block.aroundMines]
}

function handleMouse($event: MouseEvent) {
  // console.log($event);
  if ($event.buttons === 3)
    emits('lrclick')
  else if ($event.buttons === 1)
    emits('lclick')

  else if ($event.buttons === 2)
    emits('rclick')
}
</script>

<template>
  <div>
    <button
      class="flex justify-center items-center flex-col border-2  m-0.5" :class="getMineClass(block)"
      style="min-width: 2rem;min-height:2rem;" @mousedown="handleMouse($event)"
    >
      <template v-if="block.isFlag">
        <div>
          <Icon class=" text-red-500 " icon="bxs:flag-checkered" width="22" />
        </div>
      </template>
      <template v-else-if="block.isOpen || isCheat">
        <div v-if="block.isMine">
          <Icon class="text-black" icon="mdi:mine" />
        </div>
        <div v-else>
          {{ block.aroundMines }}
        </div>
      </template>
    </button>
  </div>
</template>

<style scoped>
</style>
