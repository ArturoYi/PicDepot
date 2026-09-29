/** SSR stub：TIFF 解码只在浏览器里做，避免打进 Worker */
interface TiffPage {
  width?: number
  height?: number
  t256?: number[]
  t257?: number[]
  subIFD?: TiffPage[]
}

export function decode(_buffer: ArrayBuffer): TiffPage[] {
  return []
}

export function decodeImage(_buffer: ArrayBuffer, _page: TiffPage, _pages?: TiffPage[]): void {}

export function toRGBA8(_page: TiffPage): Uint8Array {
  return new Uint8Array()
}

const UTIF = { decode, decodeImage, toRGBA8 }
export default UTIF
