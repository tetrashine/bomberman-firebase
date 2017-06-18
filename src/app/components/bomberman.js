

export default class Bomberman {
    constructor(uid, coord, isSelf) {
        this.reset();

        this.playerId = uid;
        this.name = "Player " + uid;
        this.isSelf = isSelf;

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

        // Animation
        this.sourceX = 0;
        this.Fps = 8;
        this.totalFrames = 16;
        this.currentFrame = 0;
        this.framesPerType = 4;
        this.timeBetweenFrames = 0.0625;
        this.timeSinceLastFrame = 0.0625;
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

    isCurrPlayer() { return this.isSelf; }
    getId() { return this.playerId; }
    getX() { return this.coord.getX(); }
    getY() { return this.coord.getY(); }
    addX(val) { this.coord.addX(val); }
    addY(val) { this.coord.addY(val); }
    getCoord() { return this.coord; }
    getWidth() { return this.width; }
    getHeight() { return this.height; }
    getImage() { return this.image; }
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
        //cumulative time since last animation
        this.timeSinceLastFrame -= dt;
        if (this.timeSinceLastFrame <= 0) {
           this.timeSinceLastFrame += this.timeBetweenFrames;
           this.currentFrame = (this.currentFrame + 1) % (this.framesPerType);
           this.sourceX = (this.getType() * this.width * this.framesPerType) + (this.currentFrame * this.width);
        }
    }

    getSourceX() {
        return this.sourceX;
    }

    hasUpdatedPosition() { return this.updatedPosition; }
    resetPositionUpdate() { this.updatedPosition = false; }
    setCoord(newCoord) { this.coord = newCoord; this.updatedPosition = true; }
}
