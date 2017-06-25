
import * as rap from 'raphael';

export default class UI {
    constructor(id) {
        this.fullWidth = 1248;
        this.fullHeight = 608;
        this.cellPixel = 32;

        let container = document.getElementById(id);
        this.canvas = document.createElement('canvas');
        this.background = document.createElement('canvas');
        this.canvas.width = this.background.width = this.fullWidth;
        this.canvas.height = this.background.height = this.fullHeight;

        this.canvas.style.position = "absolute";
        this.canvas.style.zIndex = 1;
        this.background.style.position = "relative";
        this.background.style.zIndex = 0;

        container.appendChild(this.canvas);
        container.appendChild(this.background);

        this.canvas = this.canvas.getContext("2d");
        this.background = this.background.getContext("2d");
    }

    getFullWidth() { return this.fullWidth; }
    getFullHeight() { return this.fullHeight; }
    getCellPixel() { return this.cellPixel; }

    drawMap(map) {
        let width = map.getWidth();
        let height = map.getHeight();
        let content = map.getMap();
        let background = this.background;
        let cellPixel = this.getCellPixel();
        let image = new Image();
        image.src = "/img/brick.png";
        image.onload = imageLoaded;

        background.fillStyle = "#368A00";
        background.beginPath();
        background.rect(0, 0, this.getFullWidth(), this.getFullHeight());
        background.closePath();
        background.fill();

        function imageLoaded() {
            for (let w = 0; w < width; w++) {
                for (let h = 0; h < height; h++) {
                    if (content[h][w] === 1) {
                        background.drawImage(image, w * cellPixel, h * cellPixel, cellPixel, cellPixel);
                    }
                }
            }
        }
    }

    drawMapObjects(mapObjs) {
        let canvas = this.canvas;
        mapObjs.forEach((mapObj, i) => {
            canvas.drawImage(mapObj.getImage(), mapObj.getSourceX(), 0, mapObj.getWidth(), mapObj.getHeight(), mapObj.getX(), mapObj.getY(), mapObj.getWidth(), mapObj.getHeight());
            if (mapObj.getName) {
                canvas.font = '14px sans-serif';
                canvas.fillText(mapObj.getName(), mapObj.getWidth() / 2, mapObj.getHeight() / 2);
            }
        });
    }

    clearScreen() {
        this.canvas.clearRect(0, 0, this.getFullWidth(), this.getFullHeight());
    }

    writeFpsMessage(message) {
        this.canvas.font        = '14px sans-serif';
        this.canvas.fillText(message, 10, 20);
    }
}
