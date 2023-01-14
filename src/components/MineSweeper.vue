<script setup lang="ts">
import SpritesJSON from '@/assets/sprites.json'
import { GameController } from '@/utils/GameController'
import type { AudioSprite } from '@/utils/type'
import { GameStatus, OperationLabel } from '@/utils/type'
import { AudioPlayer } from '@/utils/audio'
import audiosprite from '@/assets/audiosprite.mp3'

interface InputOptions {
  width: number
  height: number
  mine: number
}
interface Records {
  [option: string]: Array<number>
}
const options = ref<InputOptions>({
  width: 5,
  height: 5,
  mine: 5,
})
const Game = ref<GameController>(new GameController(options.value))

const activeOne = ref({
  x: 0,
  y: 0,
})

const time = ref(0)
let timer = -1
const sprites: Record<string, AudioSprite> = {}
SpritesJSON.forEach((s: any) => {
  sprites[s.name] = s
})
const audioPlayer = ref(new AudioPlayer(sprites, audiosprite))

const records = useLocalStorage('mine-records', {} as Records)
const { proxy } = getCurrentInstance()!
const emitter = proxy!.$mitt

emitter.on('predict', (label) => {
  if (Game.value && (Game.value.status === GameStatus.RUNNING || Game.value.status === GameStatus.STOP)) {
    if (label === OperationLabel.LEFT)
      activeOne.value.x = activeOne.value.x === 0 ? 0 : activeOne.value.x - 1
    if (label === OperationLabel.RIGHT)
      activeOne.value.x = activeOne.value.x === Game.value.width - 1 ? Game.value.width - 1 : activeOne.value.x + 1
    if (label === OperationLabel.UP)
      activeOne.value.y = activeOne.value.y === 0 ? 0 : activeOne.value.y - 1
    if (label === OperationLabel.DOWN)
      activeOne.value.y = activeOne.value.y === Game.value.height - 1 ? Game.value.height - 1 : activeOne.value.y + 1
    if (label === OperationLabel.CLICK)
      Game.value.openBlock(Game.value.blocks[activeOne.value.x][activeOne.value.y])
  }
})

watch(() => Game.value.status, (v) => {
  emitter.emit('gameStatusChange', v)
  if (v === GameStatus.RUNNING) {
    time.value = 0
    timer = setInterval(() => {
      time.value++
    }, 1000)
  }
  else {
    clearInterval(timer)
    if (v === GameStatus.WIN) {
      if (!records.value[JSON.stringify(options.value)]) {
        records.value[JSON.stringify(options.value)] = []
      }
      else {
        records.value[JSON.stringify(options.value)].push(time.value)
        records.value[JSON.stringify(options.value)].sort()
      }
      audioPlayer.value.play('gameWin')
    }
    else {
      audioPlayer.value.play('gameLose')
    }
  }
})

function createGame() {
  if (options.value.mine >= options.value.height * options.value.width)
    options.value.mine = options.value.height * options.value.width - 1
  if (options.value.mine <= 0)
    options.value.mine = 1
  if (!records.value[JSON.stringify(options.value)])
    records.value[JSON.stringify(options.value)] = []
  Game.value = new GameController(options.value)
}

function handleLClick(block: any) {
  if (Game.value) {
    Game.value.openBlock(block)
    audioPlayer.value.play('btnClick')
  }
}

function handleLRClick(block: any) {
  if (Game.value) {
    Game.value.autoOpen(block)
    audioPlayer.value.play('btnClick')
  }
}

function handleRClick(block: any) {
  if (Game.value) {
    Game.value.setFlag(block)
    audioPlayer.value.play('btnClick')
  }
}
</script>

<template>
  <div class="flex justify-center flex-wrap items-center">
    <Menu v-model:cheat="Game.isCheat" v-model:volume="audioPlayer.volume" />
    <div class="flex-none ">
      <div class=" text-center">
        <button class="border-yellow-400 text-yellow-500 border-2 p-1 m-2 rounded-md" @click="createGame">
          Start Game
        </button>
      </div>
      <div>
        <input v-model="options.width" type="number" placeholder="width" :min="1" :step="1" class="input-props">
      </div>
      <div>
        <input
          v-model="options.height" type="number" placeholder="height" :min="1" :step="1"
          class="input-props"
        >
      </div>
      <div>
        <input v-model="options.mine" type="number" placeholder="mine" :min="1" :step="1" class="input-props">
      </div>
    </div>
    <div class="flex-1 text-center">
      <template v-if="Game">
        <div>
          <p>
            Time: {{ time }}
          </p>
          <p>
            Remaining Mines: {{ Game.remaining }}
          </p>
        </div>
        <div class="flex items-center justify-center">
          <div v-for="(row, x) in Game?.blocks" :key="x" class="flex items-center justify-center flex-col">
            <MineBlock
              v-for="(block, y) in row" :key="x * Game.height + y"
              :block="block"
              :is-cheat="Game.isCheat"
              :class="{ active: block.x === activeOne.x && block.y === activeOne.y }"
              @lclick="handleLClick(block)"
              @lrclick="handleLRClick(block)"
              @rclick="handleRClick(block)"
              @contextmenu.prevent="function(){}"
            />
          </div>
        </div>
        <div>
          <p>
            Your Records in
            <br>
            Game(width:{{ options.width }},height:{{ options.height }},mine:{{ options.mine }}):
            <br>
            {{ records[JSON.stringify(options)] }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.input-props {
  padding: 0.25rem;
  font-size: large;
  border: #248fe6 1px solid;
  border-radius: 0.5rem;
}

.input-props:focus {
  outline: 0;
  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px rgba(102, 175, 233, .6);
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px rgba(102, 175, 233, .6)
}

.active {
  border: 2px solid rgb(86, 244, 128);
}
</style>
