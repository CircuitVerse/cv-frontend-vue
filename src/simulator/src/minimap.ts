import { simulationArea } from './simulationArea';

declare const lightMode: boolean;
import { colors } from './themer/themer';
import { layoutModeGet } from './layoutMode';
import { updateOrder } from './metadata';
import { CircuitElement,GlobalScope,MiniMapArea} from './types/minimap.types' 

declare const globalScope: GlobalScope;

const miniMapArea: MiniMapArea = {
    canvas: document.getElementById('miniMapArea') as HTMLCanvasElement,
    pageY: 0,
    pageX: 0,
    pageHeight: 0,
    pageWidth: 0,
    minY: 0,
    maxY: 0,
    minX: 0,
    maxX: 0,
    ctx: null as unknown as CanvasRenderingContext2D,

    setup() {
        if (lightMode) return;
        this.canvas = document.getElementById('miniMapArea') as HTMLCanvasElement;
        this.pageHeight = window.innerHeight;
        this.pageWidth = window.innerWidth;
        this.pageY = this.pageHeight - globalScope.oy;
        this.pageX = this.pageWidth - globalScope.ox;

        this.minY = simulationArea.minHeight !== undefined
            ? Math.min(simulationArea.minHeight, -globalScope.oy / globalScope.scale)
            : -globalScope.oy / globalScope.scale;

        this.maxY = simulationArea.maxHeight !== undefined
            ? Math.max(simulationArea.maxHeight, this.pageY / globalScope.scale)
            : this.pageY / globalScope.scale;

        this.minX = simulationArea.minWidth !== undefined
            ? Math.min(simulationArea.minWidth, -globalScope.ox / globalScope.scale)
            : -globalScope.ox / globalScope.scale;

        this.maxX = simulationArea.maxWidth !== undefined
            ? Math.max(simulationArea.maxWidth, this.pageX / globalScope.scale)
            : this.pageX / globalScope.scale;

        const h = this.maxY - this.minY;
        const w = this.maxX - this.minX;

        const ratio = Math.min(250 / h, 250 / w);
        if (h > w) {
            this.canvas.height = 250.0;
            this.canvas.width = (250.0 * w) / h;
        } else {
            this.canvas.width = 250.0;
            this.canvas.height = (250.0 * h) / w;
        }

        this.canvas.height += 5;
        this.canvas.width += 5;

        const miniMapElement = document.getElementById('miniMap');
        if (miniMapElement) {
            miniMapElement.style.height = `${this.canvas.height}px`;
            miniMapElement.style.width = `${this.canvas.width}px`;
        }
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.play(ratio);
    },

    play(ratio: number) {
        if (lightMode || layoutModeGet()) return;

        this.ctx.fillStyle = '#bbb';
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fill();
        this.resolve(ratio);
    },

    resolve(ratio: number) {
        if (lightMode) return;

        this.ctx.fillStyle = '#ddd';
        this.ctx.beginPath();
        this.ctx.rect(
            2.5 + ((this.pageX - this.pageWidth) / globalScope.scale - this.minX) * ratio,
            2.5 + ((this.pageY - this.pageHeight) / globalScope.scale - this.minY) * ratio,
            (this.pageWidth * ratio) / globalScope.scale,
            (this.pageHeight * ratio) / globalScope.scale
        );
        this.ctx.fill();

        const lst = updateOrder;
        const miniFill = colors['mini_fill'];
        const miniStroke = colors['mini_stroke'];

        this.ctx.strokeStyle = miniStroke;
        this.ctx.fillStyle = miniFill;
        for (const item of lst) {
            if (item === 'wires') {
                for (const wire of globalScope[item]) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(
                        2.5 + (wire.node1.absX() - this.minX) * ratio,
                        2.5 + (wire.node1.absY() - this.minY) * ratio
                    );
                    this.ctx.lineTo(
                        2.5 + (wire.node2.absX() - this.minX) * ratio,
                        2.5 + (wire.node2.absY() - this.minY) * ratio
                    );
                    this.ctx.stroke();
                }
            } else if (item !== 'nodes') {
                const ledY = ['DigitalLed', 'VariableLed', 'RGBLed'].includes(item) ? 20 : 0;

                for (const obj of globalScope[item] as CircuitElement[]) {
                    this.ctx.beginPath();
                    this.ctx.rect(
                        2.5 + (obj.x - obj.leftDimensionX - this.minX) * ratio,
                        2.5 + (obj.y - obj.upDimensionY - this.minY) * ratio,
                        (obj.rightDimensionX + obj.leftDimensionX) * ratio,
                        (obj.downDimensionY + obj.upDimensionY + ledY) * ratio
                    );
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }
        }
    },

    clear() {
        if (lightMode) return;
        $('#miniMapArea').css('z-index', '-1');
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
};

const lastMiniMapShown = {
    value: 0
};

export function updatelastMinimapShown(): void {
    lastMiniMapShown.value = new Date().getTime();
}

export function removeMiniMap(): void {
    if (lightMode) return;

    if (simulationArea.lastSelected === globalScope.root && simulationArea.mouseDown) return;
    if (lastMiniMapShown.value + 2000 >= new Date().getTime()) {
        setTimeout(removeMiniMap, lastMiniMapShown.value + 2000 - new Date().getTime());
        return;
    }
    $('#miniMap').fadeOut('fast');
}

export { miniMapArea };
