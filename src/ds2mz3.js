#!/usr/bin/env node

import * as fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { ds2mz3 } from './lib/loader.js'
import { performance } from 'perf_hooks'

// Convert `import.meta.url` to __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function makeMz3(vertices, indices) {
  const magic = 23117
  const attr = 3
  const nface = indices.length / 3
  const nvert = vertices.length / 3
  const nskip = 0
  // Calculate buffer size
  const headerSize = 16
  const indexSize = nface * 3 * 4 // Uint32Array
  const vertexSize = nvert * 3 * 4 // Float32Array
  const totalSize = headerSize + indexSize + vertexSize
  const buffer = new ArrayBuffer(totalSize)
  const writer = new DataView(buffer)
  // Write header
  writer.setUint16(0, magic, true)
  writer.setUint16(2, attr, true)
  writer.setUint32(4, nface, true)
  writer.setUint32(8, nvert, true)
  writer.setUint32(12, nskip, true)
  // Write indices
  let offset = headerSize
  new Uint32Array(buffer, offset, indices.length).set(indices)
  offset += indexSize
  // Write vertices
  new Float32Array(buffer, offset, vertices.length).set(vertices)
  return new Uint8Array(buffer)
}

// Check command-line arguments
if (process.argv.length < 3) {
  console.error('Usage: node vox2nii.js <input.vox>')
  process.exit(1)
}

const inputFile = process.argv[2]
const outputFile = inputFile.replace(/\.3ds$/, '.mz3')

// Read and parse the `.vox` file
async function convertVoxToNifti() {
  try {
    const data = await fs.readFile(inputFile)
    const startTime = performance.now()
    const { positions, indices } = await ds2mz3(data.buffer, true)
    const mz3 = makeMz3(positions, indices)
    await fs.writeFile(outputFile, Buffer.from(mz3.buffer))
    console.log(`Converted to ${outputFile} in ${performance.now() - startTime}ms`)
  } catch (error) {
    console.error('Error processing file:', error.message)
  }
}

convertVoxToNifti()
