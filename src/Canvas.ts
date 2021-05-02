import { Structure } from "@webmc/core"
import { read as readNbt } from '@webmc/nbt'
import { StructureRenderer } from '@webmc/render';
import { ResourceManager } from './ResourceManager'
import { mat4 } from 'gl-matrix'


export class RenderCanvas {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext | any;
    structure: Structure | any;
    renderer: StructureRenderer | any;
    resources: ResourceManager;
    dragPos: [number, number] | null = null;
    dragButton: number | any;

    yRotation: number = 0.5;
    xRotation: number = 0.8;
    viewDist: number = 4;

    constructor(canvas: HTMLCanvasElement, resources: ResourceManager) {

        this.canvas = canvas;
        this.resources = resources;

        this.gl = canvas.getContext('webgl');

        if (!this.gl) {
            throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.');
        }

        if (!this.canvas.getAttribute('src')) {
            throw new Error('The src attribute are empty');
        }

        fetch(this.canvas.getAttribute('src') as string)
            .then(res => res.arrayBuffer())
            .then(data => {
                const nbt = readNbt(new Uint8Array(data));
                if (!nbt) {
                    throw new Error('Empty nbt data');
                }
                this.structure = Structure.fromNbt(nbt.result);


                this.renderer = new StructureRenderer(this.gl, this.structure, {
                    blockModels: this.resources,
                    blockDefinitions: this.resources,
                    blockAtlas: this.resources.getBlockAtlas(),
                    blockProperties: this.resources
                })

                requestAnimationFrame(this.render.bind(this));

            });

        // Setup Event 

        this.canvas.addEventListener('mousedown', evt => {
            this.dragPos = [evt.clientX, evt.clientY];
            this.dragButton = evt.button;
        });

        this.canvas.addEventListener('mousemove', evt => {
            if (this.dragPos) {
                if (this.dragButton === 0) {
                    this.yRotation += (evt.clientX - this.dragPos[0]) / 100;
                    this.xRotation += (evt.clientY - this.dragPos[1]) / 100;
                }
                this.dragPos = [evt.clientX, evt.clientY];
                requestAnimationFrame(this.render.bind(this));
            }
        });

        this.canvas.addEventListener('mouseup', evt => {
            this.dragPos = null;
        });

        this.canvas.addEventListener('contextmenu', evt => {
            evt.preventDefault();
        });

        this.canvas.addEventListener('wheel', evt => {
            this.viewDist += evt.deltaY / 100
            requestAnimationFrame(this.render.bind(this));
        })

        window.addEventListener('resize', () => {
            if (this.resize()) {
                requestAnimationFrame(this.render.bind(this));
            }
        })

    }

    resize() {

        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;

            this.renderer.setViewport(0, 0, this.canvas.width, this.canvas.height)
            return true
        }
    }

    render() {
        this.resize();

        this.yRotation = this.yRotation % (Math.PI * 2)
        this.xRotation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.xRotation))
        this.viewDist = Math.max(1, Math.min(20, this.viewDist))

        const size = this.structure.getSize()
        const viewMatrix = mat4.create();
        mat4.translate(viewMatrix, viewMatrix, [0, 0, - this.viewDist]);
        mat4.rotate(viewMatrix, viewMatrix, this.xRotation, [1, 0, 0]);
        mat4.rotate(viewMatrix, viewMatrix, this.yRotation, [0, 1, 0]);
        mat4.translate(viewMatrix, viewMatrix, [-size[0] / 2, -size[1] / 2, -size[2] / 2]);

        this.renderer.drawGrid(viewMatrix);
        this.renderer.drawStructure(viewMatrix);
    }
}