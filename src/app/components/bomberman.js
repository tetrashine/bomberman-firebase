

export default class Bomberman {
    constructor(uid, coord, isSelf) {
        this.reset();

        this.playerId = uid;
        this.name = "Player " + uid;
        let image = new Image();
        image.src = isSelf ? "/img/selfbomberman.png" : "/img/oppbomberman.png";
        this.image = image;

        // Coordinates
        this.coord = coord;

        // Game Object
		this.height		= 32;
		this.width		= 32;

        // Bomb related
        this.bombStr = 8;
        this.bombs = 8;
        this.bombsMax = this.bombs;
        this.denotateTime = 3;
        this.explodeDuration = 1;
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
        let planted = false;
        if (this.bombs > 0) {
            this.bombs --;
            planted = true;
        }
        return planted;
    }

    getX() { return this.coord.getX(); }
    getY() { return this.coord.getY(); }
    addX(val) { this.coord.addX(val); }
    addY(val) { this.coord.addY(val); }
    getCoord() { return this.coord; }
    getWidth() { return this.width; }
    getHeight() { return this.height; }
    getImage() { return this.image; }
    getSpeed() { return this.speed; }

    hasUpdatedPosition() { return this.updatedPosition; }
    resetPositionUpdate() { this.updatedPosition = false; }
    setCoord(newCoord) { this.coord = newCoord; this.updatedPosition = true; }
}
