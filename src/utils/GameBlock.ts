export interface GameBlockOption {
  isMine?: boolean
  isOpen?: boolean
  isFlag?: boolean
  x?: number
  y?: number
}

const defaultOptions: GameBlockOption = {
  isMine: false,
  isOpen: false,
  isFlag: false,
}

export class GameBlock {
  isMine: boolean
  isOpen: boolean
  isFlag: boolean
  aroundMines: number
  x: number
  y: number
  constructor(options?: GameBlockOption) {
    const option = options || defaultOptions
    this.isMine = option.isMine || false
    this.isOpen = option.isOpen || false
    this.isFlag = option.isFlag || false
    this.x = option.x || 0
    this.y = option.y || 0
    this.aroundMines = 0
  }
}
