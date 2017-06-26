
import Map from 'app/components/map';
import Bomb from 'app/components/bomb';
import Coord from 'app/data/coordinates';
import Bomberman from 'app/components/bomberman';
import Direction from 'app/data/direction';
import Explosion from 'app/components/explosion';

export default class Engine {
    constructor(ui, db) {
        this.ui = ui;
        this.db = db;
        this.map = new Map();
        this.player = null;
        this.players = [];
        this.playersById = {};
        this.bombs = [];
        this.explosions = [];
        this.gameStarted = false;
        this.accumulatedTiming = 0;
        this.stepInterval = 0.016666666666667;
        this.setLastTiming();

        this.engineInterval = this.engineInterval.bind(this);
    }

    playerExist(id) { return (this.playersById[id]); }

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
        //register to add opponents
        this.registerOpponentEvents();
        //add self
        this.addPlayer(this.db.getMyId(), this.getEmptyPoint(), true);
        //update player location
        this.db.savePlayerInfo(this.player);
        //clear past bombs information
        this.db.updatePlayerBombs([]);
    }

    plantBombByPlayer() {
        //let coord = this.player.getCoord();
        //let mapTile = this.mapToTileCoord(coord);

        this.plantBomb(this.player);
    }

    plantBomb(player) {
        let bomb = player.getBomb();
        let bombCoord = bomb.getCoord();
        let bombTileCoord = this.mapToTileCoord(bombCoord);
        if (this.map.plantable(bombTileCoord) && player.plantBomb()) {
            bomb.setCoord(this.tileToMapCoord(bombTileCoord));
            this.bombs.push(bomb);
            this.map.addObject(bombTileCoord, bomb);
            //save to db
            this.db.updatePlayerBombs(player.getBombs());
        }
    }

    printAllPlayers() {
        console.log(this.players);
        console.log(this.map);
    }

    registerOpponentEvents() {
        this.db.onNewPlayer((data) => {
            let id = data.key;
            if (!this.playerExist(id)) {
                let player = data.val()
                let rawCoord = player.coord;
                let coord = new Coord(rawCoord.x, rawCoord.y);
                this.addPlayer(id, coord);

                let bombs = player.bombs;
                if (bombs) {
                    Object.keys(bombs).forEach(key => {
                        let coord = bombs[key];
                        this.bombs.push(new Bomb(new Coord(coord.x, coord.y)));
                    });
                }
            }
        });

        this.db.onPlayerUpdate((data) => {
            let id = data.key;
            let player = data.val();
            let rawCoord = player.coord;
            let coord = new Coord(rawCoord.x, rawCoord.y);
            this.updatePlayerPosition(id, coord);

            let bombs = player.bombs;
            if (bombs) {
                Object.keys(bombs).forEach(key => {
                    let coord = bombs[key];
                    this.bombs.push(new Bomb(new Coord(coord.x, coord.y)));
                });
            }
        });

        this.db.onPlayerExit((data) => {
            let id = data.key;
            this.deletePlayerById(id);
        });
    }

    deletePlayer(uid) {
        delete this.playersById[uid];

        let position = 0;
        let players = this.players;
        let length = players.length;

		for (; position < length; position++) {
			if (players[position].getId() === uid) {
				players.splice(position, 1);
                break;
			}
		}
    }

    addPlayer(uid, coord, isSelf=false) {
        let bomberman = new Bomberman(uid, coord, isSelf);

        this.players.push(bomberman);
        this.playersById[uid] = bomberman;

        //keep reference to player bomberman
        if (isSelf) {
            this.player = bomberman;
        }
    }

    updatePlayerPosition(uid, coord) {
        this.playersById[uid].setCoord(coord);
    }

    getEmptyPoint() {
        let val = 1 * this.ui.getCellPixel();
        return new Coord(val, val);
    }

    engineInterval() {
        let thisTiming = new Date().getTime();
        let dt = ((thisTiming - this.getLastTiming()) / 1000);

        this.accumulatedTiming += dt;
        if (this.accumulatedTiming > this.stepInterval) {
            dt = this.accumulatedTiming;

            //game interval
            this.gameInterval(dt);

            //animation
            this.animateInterval(dt);

            //draw game
            this.drawInterval(dt);

            this.setLastTiming();

            this.accumulatedTiming = 0;
        }

        if (this.isGameStarted()) {
            requestAnimationFrame(this.engineInterval);
        }
    }

    gameInterval(dt) {
        this.movePlayer(dt);
        //save new player coord to firebase
        let player = this.player;
        if (player.hasUpdatedPosition()) {
            this.db.savePlayerInfo(player);
        }

        //check bombs for explosion
        this.increaseBombsTimer(dt);

        //check explosion for removal
        this.increaseExplosionTimer(dt);
    }

    increaseExplosionTimer(dt) {
        for (let i = this.explosions.length-1; i >= 0; i--) {
            let explosion = this.explosions[i];

            if (explosion.getPlayerId() === this.player.getId() &&
                explosion.reduceTimer(dt)) {
                // remove explosion
                this.explosions.splice(i , 1);
            }
        }
    }

    increaseBombsTimer(dt) {
        let playerId = this.player.getId();
        for (let i = this.bombs.length-1; i >= 0; i--) {
            let bomb = this.bombs[i];

            if (bomb.getPlayerId() === playerId &&
                bomb.reduceTimer(dt)) {
                //create explosion
                this.createExplosion(playerId, bomb);

                // remove bomb
                let mapObjs = this.map.removeObjects(this.mapToTileCoord(bomb.getCoord()));
                this.player.detonateBomb();
                this.bombs.splice(i , 1);
            }
        }
    }

    createExplosion(playerId, bomb) {
        let i = 1;
        let str = bomb.getStr();
        let coord = bomb.getCoord();
        let duration = bomb.getDuration();

        this.addExplosion(playerId, coord, str, duration);

        let tileCoord = this.mapToTileCoord(coord);
        while (i <= str) {
            let isEnd = (i === str)
            let up = tileCoord.copy().addY(-i);
            let down = tileCoord.copy().addY(i);
            let left = tileCoord.copy().addX(-i);
            let right = tileCoord.copy().addX(i);

            [up, right, down, left].forEach((dir, index) => {
                if (this.map.canExplodeThru(dir)) {
                    this.addExplosion(playerId, this.tileToMapCoord(dir), str, duration, index, isEnd);
                }
            });

            i++;
        }
    }

    addExplosion(playerId, coord, str, duration, directionIndex, isEnd) {
        let explosion = new Explosion(playerId, coord, str, duration, directionIndex, isEnd);
        this.explosions.push(explosion);
    }

    animateInterval(dt) {
        [this.bombs, this.explosions, this.players].forEach(list => {
            list.forEach(obj => {
                obj.animate(dt);
            });
        });
    }

    drawInterval(dt) {
        this.drawGame(dt);

        this.drawScore();
    }

    drawGame(dt) {
        //clear ui
        this.ui.clearScreen();
        //draw fps
        let framePerSec = Math.floor(1/dt);
        this.ui.writeFpsMessage("FPS:" + framePerSec);
        //draw bombs & explosion
        this.ui.drawMapObjects(this.bombs.concat(this.explosions));
        //draw players
        this.ui.drawMapObjects(this.players);
    }

    drawScore() {}

    movePlayer(dt) {
        let player = this.player;
        let speed = Math.round(player.speed * dt) % (2*this.ui.getCellPixel());

        player.resetPositionUpdate();

		// Player can only be moving upwards or downwards at any 1 time.
		// If both are pressed, going upwards take higher priority.
		if(player.up) {
			this.move(player, Direction.UP, speed);
		} else if(player.down) {
			this.move(player, Direction.DOWN, speed);
		}

		// Player can only be moving left or right at any 1 time.
		// If both are pressed, going left take higher priority.
		if(player.left) {
			this.move(player, Direction.LEFT, speed);
		} else if(player.right) {
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
