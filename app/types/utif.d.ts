declare module 'utif' {
  export interface TiffPage {
    width?: number
    height?: number
    /** ImageWidth */
    t256?: number[]
    /** ImageLength */
    t257?: number[]
    /** 部分文件把全尺寸图放在 SubIFD，首页只是缩略图 */
    subIFD?: TiffPage[]
  }

  export function decode(buffer: ArrayBuffer): TiffPage[]
  export function decodeImage(buffer: ArrayBuffer, page: TiffPage, pages?: TiffPage[]): void
  export function toRGBA8(page: TiffPage): Uint8Array

  const UTIF: {
    decode: typeof decode
    decodeImage: typeof decodeImage
    toRGBA8: typeof toRGBA8
  }

  export default UTIF
}
