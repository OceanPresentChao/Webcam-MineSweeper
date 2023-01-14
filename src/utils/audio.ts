import type { AudioSprite } from './type'
export class AudioPlayer<T extends Record<string, AudioSprite>> {
  sprites: T
  url: string
  // 0 - 1
  volume: number
  constructor(sprites: T, url: string) {
    this.sprites = sprites
    this.url = url
    this.volume = 1
  }

  play(name: keyof T) {
    const sprite = this.sprites[name]
    const au = new Audio(this.url)
    au.currentTime = sprite.start / 1000
    au.volume = this.volume
    au.play()
    au.ontimeupdate = () => {
      if (au.currentTime >= sprite.end / 1000)
        au.pause()
    }
  }

  changeVolume(volume: number) {
    this.volume = volume
  }
}
