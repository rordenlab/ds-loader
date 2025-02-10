import { describe, it, expect } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { ds2mz3 } from '../src/lib/loader.js'

describe('3DS Conversion Tests', () => {
  it('should convert 3DS to a MZ3 mesh and test properties', async () => {
    const dsFilePath = join(__dirname, 'testData', 'sink.3ds')
    const fileBuffer = await fs.readFile(dsFilePath)
    const mz3data = await ds2mz3(fileBuffer)
    expect(mz3data.length).toEqual(21040)
  })
})
