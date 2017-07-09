import Bomb from 'app/components/bomb';
import MapObject from 'app/components/mapobject';

export default class Bomberman extends MapObject {
    constructor(uid, coord, isSelf) {
        super(coord);
        this.reset();

        this.playerId = uid;
        this.name = "Player " + uid;
        this.isSelf = isSelf;

        let image = new Image();
        image.src = isSelf ? "/img/selfbomberman.png" : "/img/oppbomberman.png";
        this.image = image;

        // Bomb related
        this.bombsArr = [];
        this.bombStr = 3;
        this.bombs = 8;
        this.bombsMax = this.bombs;
        this.denotateTime = 3;
        this.explodeDuration = 1;

        // Animation
        this.totalFrames = 16;

        this.setExplodable();
    }

    reset() {
        // Statistics
        this.kills  = 0;
        this.deaths = 0;

        // Movement related
		this.speed		= 150;
		this.up			= false;
		this.down		= false;
		this.left		= false;
		this.right		= false;
        this.updatedPosition = false;
    }

    respawn() {
        this.death++;
        this.bombs = this.bombsMax;
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

    animate(dt) {
        if (this.up || this.down || this.left || this.right) {
            super.animate(dt);
        }
    }
}
