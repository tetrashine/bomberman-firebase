// draw (d3)
// appl (core)
// db   (firebase)
import UI from 'app/base/ui';
import Engine from 'app/base/engine';
import Firebase from 'app/base/db/firebase';
import Keyboard from 'app/input/keyboard';

export default class BombermanFirebase {

    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
        this.init();
    }

    reset() {
        this.engine = new Engine(
            new UI('board'),
            new Firebase()
        );

        new Keyboard(this.engine);
    }

    init() {
        //TODO: check if connect to backend
        this.engine.start();
    }
}
