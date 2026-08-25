// Binary .pose post-processing for files returned by the sign-mt API
// (format v0.1/v0.2 — byte layout mirrors node_modules/pose-format/dist/parser.js):
//   1. recolors strokes — body/face uniform blue, each finger its own color
//      (hand headers are rebuilt with one color entry per landmark, which the
//      pose-viewer renderer maps as point i → colors[i % len])
//   2. normalizes the figure into a canonical bounding box so every segment
//      renders at identical size and position

// Canonical box fully inside the 512×512 canvas: 80% of height, centered both
// axes, so the figure can never touch — let alone cross — the canvas edge.
const TARGET_BBOX = { centerX: 256, minY: 50, maxY: 460 }

export const STROKE_COLOR = { R: 0x25, G: 0x63, B: 0xeb } // #2563eb — body + face + wrists

// One distinct color per finger (MediaPipe hand landmarks: 0 = wrist,
// 1–4 thumb, 5–8 index, 9–12 middle, 13–16 ring, 17–20 pinky).
export const FINGER_COLORS = [
  { name: 'thumb', rgb: [0x16, 0xa3, 0x4a] }, // #16a34a green
  { name: 'index', rgb: [0xea, 0x58, 0x0c] }, // #ea580c orange
  { name: 'middle', rgb: [0x93, 0x33, 0xea] }, // #9333ea purple
  { name: 'ring', rgb: [0xdb, 0x27, 0x77] }, // #db2777 pink
  { name: 'pinky', rgb: [0x08, 0x91, 0xb2] }, // #0891b2 cyan
]

function colorForHandPoint(i) {
  if (i === 0) return [STROKE_COLOR.R, STROKE_COLOR.G, STROKE_COLOR.B]
  return FINGER_COLORS[Math.ceil(i / 4) - 1].rgb
}

const decoder = new TextDecoder('utf-8')

function readStr(dv, bytes, offset) {
  const len = dv.getUint16(offset, true)
  return {
    text: decoder.decode(bytes.subarray(offset + 2, offset + 2 + len)),
    bytes: bytes.slice(offset + 2, offset + 2 + len),
    end: offset + 2 + len,
  }
}

function parseHeader(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let o = 0
  const version = dv.getFloat32(o, true)
  o += 4
  const width = dv.getUint16(o, true)
  const height = dv.getUint16(o + 2, true)
  const depth = dv.getUint16(o + 4, true)
  o += 6
  const componentCount = dv.getUint16(o, true)
  o += 2

  const components = []
  let totalPoints = 0
  let maxFormatLen = 0
  for (let c = 0; c < componentCount; c++) {
    const name = readStr(dv, bytes, o)
    o = name.end
    const format = readStr(dv, bytes, o)
    o = format.end
    maxFormatLen = Math.max(maxFormatLen, format.bytes.length)
    const pointCount = dv.getUint16(o, true)
    const limbCount = dv.getUint16(o + 2, true)
    const colorCount = dv.getUint16(o + 4, true)
    o += 6
    const pointNames = []
    for (let p = 0; p < pointCount; p++) {
      pointNames.push(readStr(dv, bytes, o))
      o += 2 + dv.getUint16(o, true)
    }
    const limbs = bytes.slice(o, o + limbCount * 4)
    o += limbCount * 4
    o += colorCount * 6 // original colors are replaced, not copied
    components.push({ name, format, pointNames, limbs })
    totalPoints += pointCount
  }

  let fps
  let frameCount
  let peopleCount
  let bodyInfoSize
  if (version < 0.15) {
    fps = dv.getUint16(o, true)
    frameCount = dv.getUint16(o + 2, true)
    peopleCount = dv.getUint16(o + 4, true)
    bodyInfoSize = 6
  } else {
    fps = dv.getFloat32(o, true)
    frameCount = dv.getUint32(o + 4, true)
    peopleCount = dv.getUint16(o + 8, true)
    bodyInfoSize = 10
  }
  o += bodyInfoSize

  return {
    version,
    width,
    height,
    depth,
    components,
    totalPoints,
    dims: Math.max(maxFormatLen - 1, 1),
    headerEnd: o,
    bodyInfoSize,
    fps,
    frameCount,
    peopleCount,
  }
}

function writeStr(view, offset, strBytes) {
  view.setUint16(offset, strBytes.length, true)
  new Uint8Array(view.buffer, offset + 2, strBytes.length).set(strBytes)
  return offset + 2 + strBytes.length
}

function buildHeader(header) {
  const size =
    4 + 6 + 2 +
    header.components.reduce((sum, c) => {
      const colors = isHand(c) ? c.pointNames.length : 1
      return (
        sum +
        2 + c.name.bytes.length +
        2 + c.format.bytes.length +
        6 +
        c.pointNames.reduce((s, p) => s + 2 + p.bytes.length, 0) +
        c.limbs.length +
        colors * 6
      )
    }, 0) +
    header.bodyInfoSize

  const buffer = new ArrayBuffer(size)
  const view = new DataView(buffer)
  let o = 0
  view.setFloat32(o, header.version, true)
  o += 4
  view.setUint16(o, header.width, true)
  view.setUint16(o + 2, header.height, true)
  view.setUint16(o + 4, header.depth, true)
  o += 6
  view.setUint16(o, header.components.length, true)
  o += 2

  for (const c of header.components) {
    o = writeStr(view, o, c.name.bytes)
    o = writeStr(view, o, c.format.bytes)
    const colorCount = isHand(c) ? c.pointNames.length : 1
    view.setUint16(o, c.pointNames.length, true)
    view.setUint16(o + 2, c.limbs.length / 4, true)
    view.setUint16(o + 4, colorCount, true)
    o += 6
    for (const p of c.pointNames) {
      o = writeStr(view, o, p.bytes)
    }
    new Uint8Array(buffer, o, c.limbs.length).set(c.limbs)
    o += c.limbs.length
    for (let i = 0; i < colorCount; i++) {
      const [R, G, B] = isHand(c) ? colorForHandPoint(i) : [STROKE_COLOR.R, STROKE_COLOR.G, STROKE_COLOR.B]
      view.setUint16(o, R, true)
      view.setUint16(o + 2, G, true)
      view.setUint16(o + 4, B, true)
      o += 6
    }
  }

  if (header.bodyInfoSize === 6) {
    view.setUint16(o, header.fps, true)
    view.setUint16(o + 2, header.frameCount, true)
    view.setUint16(o + 4, header.peopleCount, true)
  } else {
    view.setFloat32(o, header.fps, true)
    view.setUint32(o + 4, header.frameCount, true)
    view.setUint16(o + 8, header.peopleCount, true)
  }
  o += header.bodyInfoSize

  return { buffer, headerEnd: o }
}

function isHand(component) {
  return component.name.text.includes('HAND')
}

export async function processPoseBlob(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const header = parseHeader(bytes)
  const { buffer: newHeader, headerEnd } = buildHeader(header)

  const out = new Uint8Array(headerEnd + (bytes.length - header.headerEnd))
  out.set(new Uint8Array(newHeader), 0)
  out.set(bytes.subarray(header.headerEnd), headerEnd)

  // normalization pass on the re-serialized buffer
  const dv = new DataView(out.buffer)
  const { totalPoints, dims, frameCount, peopleCount, bodyInfoSize } = header
  const dataStart = headerEnd
  const confidenceStart = dataStart + frameCount * peopleCount * totalPoints * dims * 4
  const xAt = k => dv.getFloat32(dataStart + k * dims * 4, true)
  const yAt = k => dv.getFloat32(dataStart + k * dims * 4 + 4, true)
  const setX = (k, v) => dv.setFloat32(dataStart + k * dims * 4, v, true)
  const setY = (k, v) => dv.setFloat32(dataStart + k * dims * 4 + 4, v, true)
  const confidenceAt = k => dv.getFloat32(confidenceStart + k * 4, true)

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let k = 0; k < frameCount * peopleCount * totalPoints; k++) {
    if (confidenceAt(k) <= 0) continue
    const x = xAt(k)
    const y = yAt(k)
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  if (Number.isFinite(minX) && maxX > minX && maxY > minY) {
    const scale = (TARGET_BBOX.maxY - TARGET_BBOX.minY) / (maxY - minY)
    const srcCenterX = (minX + maxX) / 2
    for (let k = 0; k < frameCount * peopleCount * totalPoints; k++) {
      if (confidenceAt(k) <= 0) continue
      setX(k, TARGET_BBOX.centerX + (xAt(k) - srcCenterX) * scale)
      setY(k, TARGET_BBOX.minY + (yAt(k) - minY) * scale)
    }
  } else {
    console.warn('[poseProcess] degenerate pose bbox — normalization skipped')
  }

  return new Blob([out], { type: 'application/pose' })
}
