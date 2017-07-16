
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

        this.restart();

        this.initGame();
    }

    restart() {
        this.gameStarted = true;
    }

    stop() {
        this.gameStarted = false;
    }

    initGame() {
        //read for user info before starting the game
        let userId = this.db.getMyId();
        this.db.getPlayerInfo(userId, (data) => {
            //ui show username
            this.ui.updateUserName(data.name);
            //draw basemap
            this.ui.drawMap(this.map);
            //register to add opponents
            this.registerOpponentEvents();
            //add self
            this.addPlayer(userId, data.name, this.getEmptyPoint(), 0, 0, true);
            //update player location
            this.db.savePlayerInfo(this.player);
            //clear past bombs information
            this.db.updatePlayerBombs([]);

            //register for name changes
            this.ui.registerNameChange((name) => {
                this.player.setName(name);
            });

            //start game
            requestAnimationFrame(this.engineInterval);
        });
    }

    plantBombByPlayer() {
        //let coord = this.player.getCoord();
        //let mapTile = this.mapToTileCoord(coord);

        this.plantBomb(this.player);
    }

    plantBomb(player) {
        let bombId = player.plantBomb();
        let bombCoord = player.getBombCoord();
        let bombTileCoord = this.mapToTileCoord(bombCoord);
        if (this.map.plantable(bombTileCoord) && bombId > 0) {
            let bomb = player.addBomb(bombId, this.tileToMapCoord(bombTileCoord));
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
                let kills = player.kills;
                let deaths = player.deaths;
                let name = player.name;
                let rawCoord = player.coord;
                let coord = new Coord(rawCoord.x, rawCoord.y);
                this.addPlayer(id, name, coord, kills, deaths);
            }
        });

        this.db.onPlayerUpdate((data) => {
            let playerId = data.key;
            let player = data.val();
            let rawCoord = player.coord;
            let type = player.type;
            let kills = player.kills;
            let deaths = player.deaths;
            let name = player.name
            let coord = new Coord(rawCoord.x, rawCoord.y);
            this.updatePlayer(playerId, coord, type, kills, deaths, name);

            let bombs = player.bombs;
            if (bombs) {
                Object.keys(bombs).forEach(key => {
                    let bomb = bombs[key];
                    if (!this.bombExist(playerId, bomb.id)) {
                        this.bombs.push(new Bomb(
                            new Coord(bomb.x, bomb.y),
                            playerId,
                            bomb.str,
                            bomb.detonateTime,
                            bomb.duration,
                            bomb.id
                        ));
                    }
                });
            }
        });

        this.db.onPlayerExit((data) => {
            let id = data.key;
            this.deletePlayerById(id);
        });
    }

    bombExist(playerId, bombId) {
        return this.bombs.some((ele, index) => {
            return ele.getPlayerId() === playerId && ele.getId() === bombId;
        })
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

    addPlayer(uid, name, coord, kills=0, deaths=0, isSelf=false) {
        let bomberman = new Bomberman(uid, coord, isSelf);
        bomberman.setKills(kills);
        bomberman.setDeaths(deaths);
        bomberman.setName(name || uid);

        this.players.push(bomberman);
        this.playersById[uid] = bomberman;

        //keep reference to player bomberman
        if (isSelf) {
            this.player = bomberman;
        }

        this.map.addObject(this.mapToTileCoord(coord), bomberman);
    }

    updatePlayer(uid, coord, type, kills, deaths, name) {
        let player = this.playersById[uid];
        player.setCoord(coord);
        player.setType(type);
        player.setKills(kills);
        player.setDeaths(deaths);
        player.setName(name);
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

        requestAnimationFrame(this.engineInterval);
    }

    enterGame() {
        if (!this.isGameStarted()) {
            //get respawn coord
            let coord = this.getEmptyPoint();
            this.player.setCoord(coord);
            this.map.addObject(this.mapToTileCoord(coord), this.player);

            //save to db
            this.db.savePlayerInfo(this.player);

            this.restart();
        }
    }

    gameInterval(dt) {
        this.playerInterval(dt);

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

            if (explosion.reduceTimer(dt)) {
                // remove explosion
                this.explosions.splice(i , 1);
                this.map.removeObject(this.mapToTileCoord(explosion.getCoord()), explosion);
            } else {
                // explode location
                this.explodeLocation(explosion.getCoord());
            }
        }
    }

    explodeLocation(coord) {
        let player = this.player;
        let playerId = player.getId();
        let explodables = this.map.removeExplodables(this.mapToTileCoord(coord));
        explodables
        .filter(explodable => { return explodable.getPlayerId() === playerId; })
        .forEach(explodable => {
            if (explodable instanceof Bomb) {

                //create explosion
                this.createExplosion(explodable);

                //remove bomb
                player.detonateBomb(explodable.getId());
                for (let i = this.bombs.length-1; i >= 0; i--) {
                    if (this.bombs[i] === explodable) {
                        this.bombs.splice(i , 1);
                    }
                }

                //update bomb info
                this.db.updatePlayerBombs(player.getBombs());

            } else if (explodable instanceof Bomberman) {
                //dead state
                explodable.respawn();
                explodable.setCoord(new Coord(-1, -1));
                this.db.savePlayerInfo(explodable);
                this.stop();
            }
        });
    }

    increaseBombsTimer(dt) {
        //let playerId = this.player.getId();
        for (let i = this.bombs.length-1; i >= 0; i--) {
            let bomb = this.bombs[i];

            if (bomb.reduceTimer(dt)) {
                //create explosion
                this.createExplosion(bomb);

                //remove bomb
                let player = this.player;
                let mapObjs = this.map.removeObject(this.mapToTileCoord(bomb.getCoord()), bomb);
                player.detonateBomb(bomb.getId());
                this.bombs.splice(i , 1);

                //update bomb info
                this.db.updatePlayerBombs(player.getBombs());
            }
        }
    }

    createExplosion(bomb) {
        let i = 1;
        let str = bomb.getStr();
        let coord = bomb.getCoord();
        let duration = bomb.getDuration();
        let playerId = bomb.getPlayerId();

        this.addExplosion(playerId, coord, str, duration);

        let tileCoord = this.mapToTileCoord(coord);
        let thru = [true, true, true, true];    //check if can explode through
        while (i <= str) {
            let isEnd = (i === str)
            let up = tileCoord.copy().addY(-i);
            let down = tileCoord.copy().addY(i);
            let left = tileCoord.copy().addX(-i);
            let right = tileCoord.copy().addX(i);

            [up, right, down, left].forEach((dir, index) => {
                if (thru[index] && this.map.canExplodeThru(dir)) {
                    this.addExplosion(playerId, this.tileToMapCoord(dir), str, duration, index, isEnd);
                } else {
                    thru[index] = false;
                }
            });

            i++;
        }
    }

    addExplosion(playerId, coord, str, duration, directionIndex, isEnd) {
        let tileCoord = this.mapToTileCoord(coord);
        if (this.map.hasExplosion(tileCoord)) {
            let explosion = this.map.getMapObjs(tileCoord).find(obj => {
                return obj instanceof Explosion;
            });
            explosion.update(directionIndex, isEnd);
        } else {
            let explosion = new Explosion(playerId, coord, str, duration, directionIndex, isEnd);
            this.explosions.push(explosion);
            this.map.addObject(tileCoord, explosion);
        }
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

        this.drawScoreboard();
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

        if (!this.isGameStarted()) {
            //draw continue screen
            this.ui.drawContinueScreen();
        }
    }

    drawScoreboard() {
        //draw with sorted
        this.ui.drawScoreboard(this.players.sort((p1, p2) => {
            let k1 = p1.getKills();
            let k2 = p2.getKills();
            let d1 = p1.getDeaths();
            let d2 = p2.getDeaths();
            let n1 = p1.getName();
            let n2 = p1.getName();

            if (k1 < k2) return -1;
            if (k1 > k2) return 1;
            if (d1 < d2) return -1;
            if (d1 > d2) return 1;
            if (n1 < n2) return -1;
            if (n1 > n2) return 1;
            return 0;
        }));
    }

    playerInterval(dt) {
        this.movePlayer(dt);
        this.setPlayerInvisibility(dt);
    }

    setPlayerInvisibility(dt) {
        this.player.invisibility(dt);
    }

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

        // This is to check that the player has moved enough
		// to change a slot to another slot in the map.
        let oldCoord = oriTopLeft.copy();
        let newCoord = topLeft.copy();
        oldCoord.addX(player.getWidth() / 2).addY(player.getHeight() / 2);
        newCoord.addX(player.getWidth() / 2).addY(player.getHeight() / 2);

        let oldTileCoord = this.mapToTileCoord(oldCoord);
        let newTileCoord = this.mapToTileCoord(newCoord);

        if (!oldTileCoord.same(newTileCoord)) {
			// Remove from prev location
			if (this.map.removeObject(oldTileCoord, player)) {
				// Add to new location
				this.map.addObject(newTileCoord, player);
			}
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

        if (player) {
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
