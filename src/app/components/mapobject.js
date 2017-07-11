

export default class MapObject {

    constructor(coord) {
        this.coord = coord;

        // Game Object
		this.height		= 32;
		this.width		= 32;

        // Animation
        this.sourceX = 0;
        this.Fps = 8;
        this.totalFrames = 4;
        this.currentFrame = 0;
        this.framesPerType = 4;
        this.timeBetweenFrames = 0.0625;
        this.timeSinceLastFrame = 0.0625;

        this._walkable = true;
        this._plantable = true;
        this._explodable = false;
        this._canExplodeThru = true;
    }
    walkable() { return this._walkable; }
    explodable() { return this._explodable; }
    setNotWalkable() { this._walkable = false; }
    setExplodable() { this._explodable = true; }
    getX() { return this.coord.getX(); }
    getY() { return this.coord.getY(); }
    addX(val) { this.coord.addX(val); }
    addY(val) { this.coord.addY(val); }
    getWidth() { return this.width; }
    getHeight() { return this.height; }
    getCoord() { return this.coord; }

    getImage() { return this.image; }

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

    getType() { return 0; }

    getPlayerId() { return this.playerId; }
    hasUpdatedPosition() { return this.updatedPosition; }
    resetPositionUpdate() { this.updatedPosition = false; }
    setCoord(newCoord) { this.coord = newCoord; this.updatedPosition = true; }
}
