import type { AudioSprite } from './type'
export class AudioPlayer<T extends Record<string, AudioSprite>> {
  sprites: T
  url: string
  constructor(sprites: T, url: string) {
    this.sprites = sprites
    this.url = url
  }

  play(name: keyof T) {
    const sprite = this.sprites[name]
    const au = new Audio(this.url)
    console.log(sprite)
    au.currentTime = sprite.start / 1000
    au.play()
    au.ontimeupdate = () => {
      if (au.currentTime >= sprite.end / 1000)
        au.pause()
      console.log(sprite.name, au.currentTime)
    }
  }
}
