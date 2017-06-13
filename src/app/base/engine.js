
import Map from 'app/components/map';
import Coord from 'app/util/coord';
import Bomberman from 'app/components/bomberman';

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
        return new Coord(1, 1);
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
}
