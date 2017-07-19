
import * as rap from 'raphael';
import Bomberman from 'app/components/bomberman';

export default class UI {
    constructor(id) {
        this.fullWidth = 1248;
        this.fullHeight = 544;
        this.cellPixel = 32;

        let container = document.getElementById(id);
        this.screenCanvas = document.createElement('canvas');
        this.preRenderCanvas = document.createElement('canvas');
        this.background = document.createElement('canvas');
        this.screenCanvas.width = this.preRenderCanvas.width = this.background.width = this.fullWidth;
        this.screenCanvas.height = this.preRenderCanvas.height = this.background.height = this.fullHeight;

        this.screenCanvas.style.position = "absolute";
        this.screenCanvas.style.zIndex = 1;
        this.background.style.position = "relative";
        this.background.style.zIndex = 0;

        container.appendChild(this.screenCanvas);
        container.appendChild(this.background);

        this.canvas = this.preRenderCanvas.getContext("2d");
        this.background = this.background.getContext("2d");
        this.screenCanvas = this.screenCanvas.getContext("2d");
    }

    getFullWidth() { return this.fullWidth; }
    getFullHeight() { return this.fullHeight; }
    getCellPixel() { return this.cellPixel; }

    render() {
        this.screenCanvas.drawImage(this.preRenderCanvas, 0, 0, this.getFullWidth(), this.getFullHeight());
    }

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
        background.fillRect(0, 0, this.getFullWidth(), this.getFullHeight());

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
        mapObjs.filter(mapObj => {
            return (mapObj.getX() > 0 && mapObj.getY() > 0);
        })
        .forEach((mapObj, i) => {
            if (mapObj instanceof Bomberman) {
                //draw name
                canvas.font = '14px sans-serif';
                canvas.fillStyle = 'black';
                canvas.fillText(mapObj.getName(), mapObj.getX(), mapObj.getY() - 5);

                if (mapObj.isInvisible()) {
                    canvas.globalAlpha = mapObj.getInvisblityDegree();
                }
            }

            canvas.drawImage(mapObj.getImage(), mapObj.getSourceX(), 0, 32, 32, mapObj.getX(), mapObj.getY(), 32, 32);

            canvas.globalAlpha = 1;
        });
    }

    clearScreen() {
        let width = this.getFullWidth();
        let height = this.getFullHeight();
        this.canvas.clearRect(0, 0, width, height);
        this.screenCanvas.clearRect(0, 0, width, height);
    }

    drawContinueScreen() {
        this.canvas.fillStyle = "#333";
        this.canvas.globalAlpha = 0.4;
        this.canvas.fillRect(0, 0, this.getFullWidth(), this.getFullHeight());
        this.canvas.globalAlpha = 1.0;

        this.canvas.font = 'bold 20px sans-serif';
        this.canvas.fillStyle = 'white';
        this.canvas.fillText("Press Enter to respawn", 532, 272);
    }

    writeFpsMessage(message) {
        //this.canvas.font = '14px sans-serif';
        //this.canvas.fillText(message, 10, 20);
    }

    drawScoreboard(players) {
        let playerDivs = players.map(player => {
            return `<tr>
                <td>${player.getName()}</td>
                <td>${player.getKills()}</td>
                <td>${player.getDeaths()}</td>
            </tr>`;
        });

        $('#scoreboard').html(playerDivs);
    }

    updateUserName(name) {
        $('#name').val(name);
    }

    registerNameChange(callback) {
        $("#nameBtn").bind('click', function() {
            callback($('#name').val());
        });
    }
}
