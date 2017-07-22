import Bomb from 'app/components/bomb';
import Image from 'app/data/image';
import MapObject from 'app/components/mapobject';

export default class Bomberman extends MapObject {
    constructor(uid, coord, isSelf) {
        super(coord);
        this.reset();

        this.playerId = uid;
        this.name = uid;
        this.isSelf = isSelf;
        this.killedBy = '';

        //let image = new Image();
        //image.src = isSelf ? "/img/selfbomberman.png" : "/img/oppbomberman.png";
        //this.image = image;
        this.image = isSelf ? Image.Self : Image.Opponent;

        // Bomb related
        this.bombsArr = [];
        this.bombStr = 3;
        this.bombs = 8;
        this.bombsMax = this.bombs;
        this.denotateTime = 3;
        this.explodeDuration = 1;

        // Game related
		this.invisible		= true;
		this.invisTiming	= 0;			// secs
		this.invisLength	= 4;			// secs
        this.invisDegree    = 0.5;            // 0 - 1
        this.invisDirection = 1;            // 1 or -1

        // Animation
        this.totalFrames = 16;
    }

    reset() {
        // Statistics
        this.kills  = 0;
        this.deaths = 0;

        // Movement related
		this.speed		= 300;
		this.up			= false;
		this.down		= false;
		this.left		= false;
		this.right		= false;
        this.updatedPosition = false;
    }

    respawn() {
        this.deaths++;
        this.bombs = this.bombsMax;

        this.invisible = true;
        this.setNotExplodable();
    }

    plantBomb() {
        let bombId = 0;
        if (this.bombs > 0) {
            bombId = this.bombs --;
        }
        return bombId;
    }

    detonateBomb(bombId) {
        if (this.bombs < this.bombsMax) {
            this.bombs++;
        }

        this.bombsArr = this.bombsArr.filter(bomb => {
            return bomb.id !== bombId;
        });
    }

    addBomb(bombId, coord) {
        let bomb = new Bomb(coord, this.getId(), this.bombStr, this.denotateTime, this.explodeDuration, bombId);
        this.bombsArr.push(bomb.toServerData());
        return bomb;
    }

    getBombCoord() {
        let coord = this.getCoord().copy();
        let semi = this.getWidth() / 2;
        coord.addX(semi).addY(semi);

        return coord;
    }

    getBombs() {
        let obj = {};
        this.bombsArr.forEach(bomb => {
            obj[bomb.id] = bomb;
        });

        return obj;
    }

    isCurrPlayer() { return this.isSelf; }
    getId() { return this.playerId; }
    getSpeed() { return this.speed; }

    getType() {
        let type = 0;
        /*if (this.down) {
            type 0
        } else */
        if (this.up) {
            type = 1;
        } else if (this.left) {
            type = 2;
        } else if (this.right) {
            type = 3;
        }

        return type;
    }

    setType(type) {
        this.up = this.down = this.left = this.right = false;
        switch(type) {
            case 0:
                this.down = true;
                break;
            case 1:
                this.up = true;
                break;
            case 2:
                this.left = true;
                break;
            case 3:
                this.right = true;
                break;
        }
    }

    animate(dt) {
        if (this.up || this.down || this.left || this.right) {
            super.animate(dt);
        }
    }

    invisibility(dt) {
        if (this.invisible && ((this.invisTiming += dt) > this.invisLength)) {
            this.invisTiming = 0;
            this.invisible = false;

            this.setExplodable();
        }
    }

    getKills() { return this.kills; }
    getDeaths() { return this.deaths; }
    getName() { return this.name.substr(0, 6); }
    isInvisible() { return this.invisible; }
    getKilledBy() { return this.killedBy; }

    getInvisblityDegree() {
        return 1 - (this.invisTiming % 1);
    }

    setKillerId(id) { this.killedBy = id; }
    setKills(kills) { this.kills = kills; }
    setDeaths(deaths) { this.deaths = deaths; }
    setName(name) { this.name = name; }
}
