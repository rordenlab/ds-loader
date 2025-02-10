export async function ds2mz3(inBuffer, isVerbose = false) {
  // Ensure the input is an ArrayBuffer
  if (inBuffer instanceof Uint8Array) {
    inBuffer = inBuffer.buffer.slice(inBuffer.byteOffset, inBuffer.byteOffset + inBuffer.byteLength)
  } else if (!(inBuffer instanceof ArrayBuffer) && inBuffer instanceof Buffer) {
    inBuffer = inBuffer.buffer.slice(inBuffer.byteOffset, inBuffer.byteOffset + inBuffer.byteLength)
  } else if (!(inBuffer instanceof ArrayBuffer)) {
    throw new TypeError('Input must be an ArrayBuffer, Uint8Array, or Buffer.')
  }
  const data = new DataView(inBuffer)
  let offset = 0
  let positions = []
  let indices = []
  let vertexOffset = 0 // Track cumulative vertex count

  function readUint16() {
    const value = data.getUint16(offset, true)
    offset += 2
    return value
  }

  function readUint32() {
    const value = data.getUint32(offset, true)
    offset += 4
    return value
  }

  function readFloat32() {
    const value = data.getFloat32(offset, true)
    offset += 4
    return value
  }

  function readString() {
    let str = ''
    let char
    while ((char = data.getUint8(offset++)) !== 0) {
      str += String.fromCharCode(char)
    }
    return str
  }

  function readChunk() {
    return {
      id: readUint16(),
      length: readUint32(),
      start: offset
    }
  }

  function parseChunk(startOffset, endOffset, depth) {
    offset = startOffset

    while (offset < endOffset) {
      if (offset + 6 > data.byteLength) {
        if (isVerbose) console.warn('Reached unexpected end of file.')
        break
      }

      const chunk = readChunk()
      let chunkEnd = chunk.start + chunk.length - 6

      // Validate chunk length
      if (chunk.length < 6 || chunkEnd > data.byteLength) {
        if (isVerbose) console.warn(`Skipping invalid chunk: 0x${chunk.id.toString(16)} (length: ${chunk.length})`)
        break
      }

      if (isVerbose) {
        console.log(
          `${'  '.repeat(depth)}Chunk ID: 0x${chunk.id.toString(16).padStart(4, '0')} at ${chunk.start}, length: ${chunk.length}`
        )
      }

      switch (chunk.id) {
        case 0x4d4d: // Main chunk
        case 0x3d3d: // 3D editor chunk
        case 0x4100: // Triangular mesh
          parseChunk(chunk.start, chunkEnd, depth + 1)
          break
        case 0x4000: // Object block (contains an object name before its children)
          const objectName = readString()
          if (isVerbose) console.log(`${'  '.repeat(depth)}  → Object Name: ${objectName}`)
          parseChunk(offset, chunkEnd, depth + 1)
          break
        case 0x4110: // Vertices list
          parseVertices()
          break
        case 0x4120: // Faces list (indices)
          parseFaces()
          break
        default:
          offset = chunkEnd
      }
    }
  }

  function parseVertices() {
    const vertexCount = readUint16()
    const localVertices = new Float32Array(vertexCount * 3)
    for (let i = 0; i < vertexCount * 3; i++) {
      localVertices[i] = readFloat32()
    }
    positions.push(...localVertices) // Append to global array
  }

  function parseFaces() {
    const faceCount = readUint16()
    for (let i = 0; i < faceCount; i++) {
      indices.push(
        readUint16() + vertexOffset, // Offset indices by current vertex count
        readUint16() + vertexOffset,
        readUint16() + vertexOffset
      )
      offset += 2 // Skip face flags
    }
    vertexOffset = positions.length / 3 // Update vertex offset for next object
  }
  parseChunk(0, data.byteLength, 0)
  return {
    positions,
    indices
  }
}
