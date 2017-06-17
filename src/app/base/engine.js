
import Map from 'app/components/map';
import Coord from 'app/data/coordinates';
import Bomberman from 'app/components/bomberman';
import Direction from 'app/data/direction';

export default class Engine {
    constructor(ui, db) {
        this.ui = ui;
        this.db = db;
        this.map = new Map();
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
        this.ui.drawMap(this.map);
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
        this.movePlayer(dt);
    }

    drawInterval(dt) {
        this.drawGame();

        this.drawScore();
    }

    drawGame() {
        //clear ui
        this.ui.clearScreen();
        //draw bombs
        //draw explosion
        //draw players
        this.ui.drawMapObjects(this.players);
    }

    drawScore() {}

    movePlayer(dt) {
        let player = this.player;
        let speed = Math.round(player.speed * dt) % (2*this.ui.getCellPixel());

		// Player can only be moving upwards or downwards at any 1 time.
		// If both are pressed, going upwards take higher priority.
		if(player.up) {
			//player.currentType = Bomberman.ImageManager.UpMovement;
			//animator.animate(players[i], dt);

			this.move(player, Direction.UP, speed);
		} else if(player.down) {
			//players[i].currentType = Bomberman.ImageManager.DownMovement;
			//animator.animate(players[i], dt);

			this.move(player, Direction.DOWN, speed);
		}

		// Player can only be moving left or right at any 1 time.
		// If both are pressed, going left take higher priority.
		if(player.left) {
			//players[i].currentType = Bomberman.ImageManager.LeftMovement;
			//animator.animate(players[i], dt);

			this.move(player, Direction.LEFT, speed);
		} else if(player.right) {
			//players[i].currentType = Bomberman.ImageManager.RightMovement;
			//animator.animate(players[i], dt);

			this.move(player, Direction.RIGHT, speed);
		}
    }

    move(player, direction, speed) {
        let oriTopLeft = player.getCoord();
        let topLeft = oriTopLeft.copy();
        topLeft = this.moveByDirection(topLeft, direction, speed);

        //get coordinates of 4 corners
        //depending on direction of movement, check 2 coordinates
        //UP - topLeft, topRight
        //DOWN - bottomLeft, bottomRight
        //LEFT - topLeft, bottomLeft
        //RIGHT - topRight, bottomRight
        let topRight = topLeft.copy();
        topRight.addX(player.getWidth() - 1);

        let bottomLeft = topLeft.copy();
        bottomLeft.addY(player.getHeight() - 1);

        let bottomRight = topRight.copy();
        bottomRight.addY(player.getHeight() - 1);

        let firstCheck, secCheck;
        switch(direction) {
            case Direction.UP:
                firstCheck = topLeft;
                secCheck = topRight;
                break;
            case Direction.DOWN:
                firstCheck = bottomLeft;
                secCheck = bottomRight;
                break;
            case Direction.LEFT:
                firstCheck = topLeft;
                secCheck = bottomLeft;
                break;
            case Direction.RIGHT:
                firstCheck = topRight;
                secCheck = bottomRight;
                break;
        }

        //if both ok = ok
        //if only 1 ok????
        //else move to end of curr tile
        let move;
        let movableA = this.map.walkable(this.mapToTileCoord(firstCheck));
        let movableB = this.map.walkable(this.mapToTileCoord(secCheck));

        if (movableA && movableB) {
            player.setCoord(topLeft);
        } else if (movableA) {
            let topLeftTile = this.mapToTileCoord(topLeft);
            let tileCoord = this.tileToMapCoord(topLeftTile);

            //help user to move
            //if movableA
            //U, D - move left
            //L, R - move up
            if (direction === Direction.UP || direction === Direction.DOWN) {
                move = Math.min(speed, Math.abs(topLeft.getX() - tileCoord.getX()));
                topLeft = this.moveByDirection(oriTopLeft, Direction.LEFT, move);
            } else if (direction === Direction.LEFT || direction === Direction.RIGHT) {
                move = Math.min(speed, Math.abs(topLeft.getY() - tileCoord.getY()));
                topLeft = this.moveByDirection(oriTopLeft, Direction.UP, move);
            }

            player.setCoord(topLeft);
        } else if (movableB) {
            let topRightTile = this.mapToTileCoord(topRight);
            let tileCoord = this.tileToMapCoord(topRightTile);
            //if movableB
            //U, D - move right
            //L, R - move down
            if (direction === Direction.UP || direction === Direction.DOWN) {
                move = Math.min(speed, Math.abs(topLeft.getX() - tileCoord.getX()));
                topLeft = this.moveByDirection(oriTopLeft, Direction.RIGHT, move);
            } else if (direction === Direction.LEFT || direction === Direction.RIGHT) {
                move = Math.min(speed, Math.abs(topLeft.getY() - tileCoord.getY()));
                topLeft = this.moveByDirection(oriTopLeft, Direction.DOWN, move);
            }

            player.setCoord(topLeft);
        } else {
            //move to end of curr tile
            let tile = this.mapToTileCoord(firstCheck);
            let tileCoord = this.tileToMapCoord(tile);
            let cellPixelSize = this.ui.getCellPixel();

            //reverse back
            switch(direction) {
                case Direction.UP:
                    //take new y, x of topLeft
                    tileCoord.addY(cellPixelSize);
                    topLeft.setY(tileCoord.getY());
                    break;
                case Direction.DOWN:
                    //take new y, x of topLeft
                    topLeft.setY(tileCoord.getY() - cellPixelSize);
                    break;
                case Direction.LEFT:
                    //take new x, y of topLeft
                    tileCoord.addX(cellPixelSize);
                    topLeft.setX(tileCoord.getX());
                    break;
                case Direction.RIGHT:
                    //take new x, y of topLeft
                    topLeft.setX(tileCoord.getX() - cellPixelSize);
                    break;
            }

            player.setCoord(topLeft);
        }
    }

    mapToTileCoord(coord) {
        let cellPixelSize = this.ui.getCellPixel();
        return new Coord(Math.floor(coord.getX() / cellPixelSize), Math.floor(coord.getY() / cellPixelSize));
    }

    tileToMapCoord(coord) {
        let cellPixelSize = this.ui.getCellPixel();
        return new Coord(Math.floor(coord.getX() * cellPixelSize), Math.floor(coord.getY() * cellPixelSize));
    }

    moveByDirection(coord, direction, speed) {
        switch(direction) {
            case Direction.UP:
                coord.addY(-speed);
                break;
            case Direction.DOWN:
                coord.addY(speed);
                break;
            case Direction.LEFT:
                coord.addX(-speed);
                break;
            case Direction.RIGHT:
                coord.addX(speed);
                break;
        }

        return coord;
    }

    changeDirection(direction, val=true) {
        if( !this.isGameStarted() ) { return; }
        let player = this.player;

        if(player) {
            switch(direction)
            {
                case Direction.UP:
                    player.up = val;
                    break;
                case Direction.DOWN:
                    player.down = val;
                    break;
                case Direction.LEFT:
                    player.left = val;
                    break;
                case Direction.RIGHT:
                    player.right = val;
                    break;
                default:
                    break;
            }
        }
    }
}
