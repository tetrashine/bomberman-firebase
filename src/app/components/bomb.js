import MapObject from 'app/components/mapobject';

export default class Bomb extends MapObject {
    constructor(coord, uid, str, detonateTime, duration, bombId) {
        super(coord);

        this.bombId = bombId;
        this.playerId = uid;

        let image = new Image();
        image.src = "/img/bomb.png";
        this.image = image;

        this.str = str;
        this.coord = coord;
        this.explodeDuration = duration;
        this.detonateTime = detonateTime;

        this.setNotWalkable();
        this.setExplodable();
    }

    reduceTimer(dt) {
        this.detonateTime -= dt;

        return this.detonateTime < 0;
    }

    getId() { return this.bombId; }
    getStr() { return this.str; }
    getDuration() { return this.explodeDuration; }
    getDetonateTime() { return this.detonateTime; }

    toServerData() {
        return {
            'id': this.getId(),
            'x': this.coord.getX(),
            'y': this.coord.getY(),
            'str': this.getStr(),
            'duration': this.getDuration(),
            'detonateTime': this.getDetonateTime()
        };
    }
}
