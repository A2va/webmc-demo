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
        this.canvas.oncontextmenu = this.contextmenuEvt
        this.canvas.onresize = this.resizeEvt;

        this.canvas.onwheel = this.wheelEvt;
        this.canvas.onmouseup = this.mouseupEvt;
        this.canvas.onmousemove = this.mousemoveEvt;
        this.canvas.onmousedown = this.mousedownEvt;

        this.canvas.ontouchstart = this.ontouchstartEvt
        this.canvas.ontouchend = this.ontouchendEvt;
        this.canvas.ontouchmove = this.ontouchmoveEvt;
        this.canvas.ontouchcancel = this.ontouchcancelEvt;

    }

    ontouchcancelEvt = (evt: TouchEvent) => {
        evt.preventDefault();
    }

    ontouchmoveEvt = (evt: TouchEvent) => {
        const touch: Touch = evt.targetTouches[0];
        const touches: TouchList = evt.targetTouches;
        const par = document.querySelectorAll("p")[0]
        par.innerText = evt.targetTouches.length.toString();
        // if (evt.targetTouches.length > 1) {
        //     const lastDistance = Math.sqrt(
        //         (touches[0].clientX - touches[1].clientX) *
        //         (touches[0].clientX - touches[1].clientX) +
        //         (touches[0].clientY - touches[1].clientY) *
        //         (touches[0].clientY - touches[1].clientY)
        //     );
        //     this.viewDist += lastDistance / 100;
        //     requestAnimationFrame(this.render.bind(this));
        //     return;
        // }
        if (this.dragPos) {
            if (this.dragButton === 0) {
                this.yRotation += (touch.clientX - this.dragPos[0]) / 100;
                this.xRotation += (touch.clientY - this.dragPos[1]) / 100;
            }
            this.dragPos = [touch.clientX, touch.clientY];
            requestAnimationFrame(this.render.bind(this));
        }
    }

    ontouchendEvt = (evt: TouchEvent) => {
        this.dragPos = null;
    }

    ontouchstartEvt = (evt: TouchEvent) => {
        this.dragPos = [evt.targetTouches[0].clientX, evt.targetTouches[0].clientY];
        this.dragButton = 0;
    }

    resizeEvt = (evt: UIEvent) => {
        evt.preventDefault();
    }

    contextmenuEvt = (evt: MouseEvent) => {
        evt.preventDefault();
    }

    mouseupEvt = (evt: MouseEvent) => {
        this.dragPos = null;
    }

    mousedownEvt = (evt: MouseEvent) => {
        this.dragPos = [evt.clientX, evt.clientY];
        this.dragButton = evt.button;
    }

    mousemoveEvt = (evt: MouseEvent) => {
        if (this.dragPos) {
            if (this.dragButton === 0) {
                this.yRotation += (evt.clientX - this.dragPos[0]) / 100;
                this.xRotation += (evt.clientY - this.dragPos[1]) / 100;
            }
            this.dragPos = [evt.clientX, evt.clientY];
            requestAnimationFrame(this.render.bind(this));
        }
    }

    wheelEvt = (evt: WheelEvent) => {
        this.viewDist += evt.deltaY / 100
        requestAnimationFrame(this.render.bind(this));
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