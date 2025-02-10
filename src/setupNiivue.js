import { Niivue } from '@niivue/niivue'
import { ds2mz3 } from './lib/loader'

export async function setupNiivue(element) {
  const nv = new Niivue({backColor: [1, 1, 1, 1]})
  nv.attachToCanvas(element)
  // supply loader function, fromExt, and toExt (without dots)
  nv.useLoader(ds2mz3, '3ds', 'mz3')
  await nv.loadMeshes([
    {
      url: '/dolphin.3ds'
    }
  ])
}
