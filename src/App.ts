import { Structure } from "@webmc/core"
import { read as readNbt } from '@webmc/nbt'
import { StructureRenderer } from '@webmc/render';
import { ResourceManager } from './ResourceManager'
import { mat4 } from 'gl-matrix'
import { RenderCanvas } from './Canvas'

import sizeof from 'object-sizeof';
import * as base64 from "byte-base64";


main();

async function main() {

  let resources: ResourceManager;
  resources = new ResourceManager();
  
  await resources.loadFromZip('./assets.zip');

  document.querySelectorAll(".webmc").forEach(function (node) {
    new RenderCanvas(node as HTMLCanvasElement, resources);
  });
}
