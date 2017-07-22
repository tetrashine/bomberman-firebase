import Image from 'app/data/image';
import MapObject from 'app/components/mapobject';

export default class Explosion extends MapObject {
    constructor(playerId, coord, str, duration, directionIndex=-1, isEnd=true) {
        super(coord);

        this.Fps = 7;
        this.totalFrames = 7;
        this.framesPerType = 7;
        // 1 sec - 7 frames
        // 1 frame = 1/7 secs
        this.timeBetweenFrames = 0.1429;
        this.timeSinceLastFrame = this.timeBetweenFrames;


        this.str = str;
        this.duration = duration;
        this.playerId = playerId;

        this.directionIndex = directionIndex;
        this.isEnd = isEnd;
        this.updateImage();
    }

    toServerData() {
        return {
            'isEnd': this.isEnd,
            'duration': this.duration,
            'directionIndex': this.directionIndex,
        };
    }

    updateImage() {
        this.image = this.getExplosionImage(this.directionIndex, this.isEnd);
    }

    getExplosionImage(directionIndex, isEnd) {
        let img = Image.ExplosionCenter;
        if (directionIndex === -1 || isEnd) {
            switch(directionIndex) {
                case -1: //center
                    img = Image.ExplosionCenter;
                    break;
                case 0: //up
                    img = Image.ExplosionUp;
                    break;
                case 1: //right
                    img = Image.ExplosionRight;
                    break;
                case 2: //down
                    img = Image.ExplosionDown;
                    break;
                case 3: //left
                    img = Image.ExplosionLeft;
                    break;
            }
        } else {
            //links
            img = (directionIndex % 2 === 0) ? Image.ExplosionUpDownLink : Image.ExplosionLeftRightLink;
        }

        return img;
    }

    reduceTimer(dt) {
        this.duration -= dt;

        return (this.duration < 0);
    }

    update(directionIndex=-1, isEnd=true) {
        if (!isEnd) {
            this.isEnd = isEnd;
        }

        if (directionIndex === -1) {
            this.directionIndex = directionIndex;
        }

        this.updateImage();
    }
}
