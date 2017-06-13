
import Map from 'app/components/map';
import Coord from 'app/data/coordinates';
import Bomberman from 'app/components/bomberman';
import Direction from 'app/data/direction';

export default class Engine {
    constructor(ui, db) {
        this.ui = ui;
        this.db = db;
        this.player = null;
        this.players = [];
        this.gameStarted = false;
        this.setLastTiming();

        this.engineInterval = this.engineInterval.bind(this);
    }

    isGameStarted() { return this.gameStarted; }
    setLastTiming() { this.lastTiming = new Date().getTime(); }
    getLastTiming() { return this.lastTiming; }

    start() {
        if (this.isGameStarted()) { return; }

        this.gameStarted = true;

        this.initGame();

        requestAnimationFrame(this.engineInterval);
    }

    initGame() {
        //draw basemap
        this.ui.drawMap(new Map());
        //add opponents
        //add self
        this.addPlayer(this.db.getMyId(), true);
    }

    addPlayer(uid, isSelf) {
        let coord = this.getEmptyPoint();
        let bomberman = new Bomberman(uid, coord, isSelf);

        this.players.push(bomberman);

        //keep reference to player bomberman
        if (isSelf) {
            this.player = bomberman;
        }
    }

    getEmptyPoint() {
        let val = 1 * this.ui.getCellPixel();
        return new Coord(val, val);
    }

    engineInterval() {
        //fps
        let thisTiming = new Date().getTime();
        let dt = ((thisTiming - this.getLastTiming()) / 1000);
        let framePerSec = Math.round(1/dt*100)/100;

        //game interval
        this.gameInterval(dt);

        //draw game
        this.drawInterval(dt);

        this.setLastTiming();

        if (this.isGameStarted()) {
            requestAnimationFrame(this.engineInterval);
        }
    }

    gameInterval(dt) {
        this.moveCharacters(dt);
    }

    drawInterval(dt) {
        this.drawGame();

        this.drawScore();
    }

    drawGame() {
        //clear ui
        //draw bombs
        //draw explosion
        //draw players
        this.ui.drawMapObjects(this.players);
    }

    drawScore() {}

    moveCharacters(dt) {

    }

    changeDirection(direction) {
        if( !this.isGameStarted() ) { return; }
        let player = this.player;

        if(player) {
            switch(direction)
            {
                case Direction.UP:
                    player.up = true;
                    break;
                case Direction.DOWN:
                    player.down = true;
                    break;
                case Direction.LEFT:
                    player.left = true;
                    break;
                case Direction.RIGHT:
                    player.right = true;
                    break;
                default:
                    break;
            }
            console.log(player);
        }
    }

    stopDirection(direction) {
        if( !this.isGameStarted() ) { return; }
        let player = this.player;

        if(player) {
            switch(direction)
            {
                case Direction.UP:
                    player.up = false;
                    break;
                case Direction.DOWN:
                    player.down = false;
                    break;
                case Direction.LEFT:
                    player.left = false;
                    break;
                case Direction.RIGHT:
                    player.right = false;
                    break;
                default:
                    break;
            }
            console.log(player);
        }
    }
}
