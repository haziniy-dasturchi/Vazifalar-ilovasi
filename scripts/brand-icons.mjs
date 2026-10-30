// =============================================================
// Brend ikonkalarini logodan yasash
// =============================================================
// Manba: Logo/PNG/haziniy-13.png (shaffof fon, belgi + yozuv).
// Skript belgining o'zini (yuqori qism) kesib oladi va kerakli
// o'lchamlarga tushiradi. Qayta ishga tushirish: npm run icons

import { PNG } from 'pngjs'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'Logo', 'PNG', 'haziniy-13.png')

// -------------------------------------------------------------
// Yordamchilar
// -------------------------------------------------------------
const isBackground = (d, i) =>
  d[i + 3] < 40 || (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245)

/** Rasmdagi ochiq piksellar bo'yicha qatorlar profili */
function rowProfile(png) {
  const rows = new Array(png.height).fill(0)
  for (let y = 0; y < png.height; y++) {
    let n = 0
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) << 2
      if (!isBackground(png.data, i)) n++
    }
    rows[y] = n
  }
  return rows
}

/** Belgining (birinchi to'liq blok) chegaralarini topish */
function findMarkBounds(png) {
  const rows = rowProfile(png)
  let y0 = rows.findIndex((n) => n > 0)
  if (y0 < 0) throw new Error('Logo fayli bo‘sh ko‘rinadi')

  // Belgi tugagan joy: uzoq davom etgan bo'sh qatorlar
  const gap = Math.round(png.height * 0.01)
  let y1 = y0
  let empty = 0
  for (let y = y0; y < png.height; y++) {
    if (rows[y] > 0) {
      empty = 0
      y1 = y
    } else if (++empty > gap) {
      break
    }
  }

  let x0 = png.width
  let x1 = 0
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) << 2
      if (isBackground(png.data, i)) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
    }
  }
  return { x0, y0, x1, y1 }
}

/** Kvadrat kesib olish (markazda), chetiga bo'sh joy qo'shib */
function cropSquare(png, b, paddingRatio) {
  const w = b.x1 - b.x0 + 1
  const h = b.y1 - b.y0 + 1
  const side = Math.round(Math.max(w, h) * (1 + paddingRatio * 2))
  const cx = (b.x0 + b.x1) / 2
  const cy = (b.y0 + b.y1) / 2
  const left = Math.round(cx - side / 2)
  const top = Math.round(cy - side / 2)

  const out = new PNG({ width: side, height: side })
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const o = (side * y + x) << 2
      const sx = left + x
      const sy = top + y
      if (sx < 0 || sy < 0 || sx >= png.width || sy >= png.height) {
        out.data[o + 3] = 0
        continue
      }
      const i = (png.width * sy + sx) << 2
      // Oq fonni shaffofga aylantiramiz
      if (isBackground(png.data, i)) {
        out.data[o + 3] = 0
        continue
      }
      out.data[o] = png.data[i]
      out.data[o + 1] = png.data[i + 1]
      out.data[o + 2] = png.data[i + 2]
      out.data[o + 3] = png.data[i + 3]
    }
  }
  return out
}

/** Maydon bo'yicha o'rtacha (box filter) kichraytirish */
function resize(png, size) {
  const out = new PNG({ width: size, height: size })
  const scale = png.width / size
  for (let y = 0; y < size; y++) {
    const sy0 = Math.floor(y * scale)
    const sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * scale))
    for (let x = 0; x < size; x++) {
      const sx0 = Math.floor(x * scale)
      const sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * scale))
      let r = 0, g = 0, b = 0, a = 0, n = 0
      for (let sy = sy0; sy < sy1 && sy < png.height; sy++) {
        for (let sx = sx0; sx < sx1 && sx < png.width; sx++) {
          const i = (png.width * sy + sx) << 2
          const al = png.data[i + 3] / 255
          // Alfa bilan og'irlangan rang — chetlar qorayib ketmasligi uchun
          r += png.data[i] * al
          g += png.data[i + 1] * al
          b += png.data[i + 2] * al
          a += png.data[i + 3]
          n++
        }
      }
      const o = (size * y + x) << 2
      const alphaAvg = a / n / 255
      out.data[o] = alphaAvg > 0 ? Math.round(r / n / alphaAvg) : 0
      out.data[o + 1] = alphaAvg > 0 ? Math.round(g / n / alphaAvg) : 0
      out.data[o + 2] = alphaAvg > 0 ? Math.round(b / n / alphaAvg) : 0
      out.data[o + 3] = Math.round(a / n)
    }
  }
  return out
}

/** Shaffof ikonkani to'q fon ustiga qo'yish (maskable uchun) */
function onBackground(png, bg) {
  const out = new PNG({ width: png.width, height: png.height })
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3] / 255
    out.data[i] = Math.round(png.data[i] * a + bg[0] * (1 - a))
    out.data[i + 1] = Math.round(png.data[i + 1] * a + bg[1] * (1 - a))
    out.data[i + 2] = Math.round(png.data[i + 2] * a + bg[2] * (1 - a))
    out.data[i + 3] = 255
  }
  return out
}

const save = (png, ...path) => {
  const file = join(root, ...path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, PNG.sync.write(png))
  console.log(`  ${path.join('/')}  ${png.width}x${png.height}`)
}

// -------------------------------------------------------------
// Ishga tushirish
// -------------------------------------------------------------
const source = PNG.sync.read(readFileSync(SRC))
const bounds = findMarkBounds(source)
console.log(
  `Manba: Logo/PNG/haziniy-13.png (${source.width}x${source.height})\n` +
    `Belgi chegarasi: ${bounds.x0},${bounds.y0} .. ${bounds.x1},${bounds.y1}\n`
)

// Oddiy ikonkalar — kichik chekka bilan
const mark = cropSquare(source, bounds, 0.06)
console.log('Yaratildi:')
save(resize(mark, 512), 'public', 'brand', 'belgi-512.png')
save(resize(mark, 512), 'public', 'icons', 'icon-512.png')
save(resize(mark, 192), 'public', 'icons', 'icon-192.png')
save(resize(mark, 512), 'app', 'icon.png')

// Apple touch ikonkasi — shaffoflikni qo'llab-quvvatlamaydi, oq fon
const appleBg = onBackground(resize(cropSquare(source, bounds, 0.12), 180), [255, 255, 255])
save(appleBg, 'app', 'apple-icon.png')

// Maskable — Android ikonkani doira/kvadratga kesadi, shuning uchun
// chetida keng xavfsiz zona kerak. Belgi to'q yashil bo'lgani uchun fon
// oq: to'q yashil fonda belgi ko'rinmay qolardi.
const maskable = onBackground(resize(cropSquare(source, bounds, 0.34), 512), [255, 255, 255])
save(maskable, 'public', 'icons', 'maskable-512.png')

// To'liq logolarni ham public/brand ga nusxalaymiz
for (const [from, to] of [
  ['haziniy-13.png', 'logo-vertikal.png'],
  ['haziniy-19.png', 'logo-gorizontal.png'],
  ['haziniy-14.png', 'logo-gorizontal-oq.png'],
]) {
  copyFileSync(join(root, 'Logo', 'PNG', from), join(root, 'public', 'brand', to))
  console.log(`  public/brand/${to}  (nusxa: ${from})`)
}

console.log('\nTayyor.')
