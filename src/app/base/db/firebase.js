
import Db from 'app/base/db/db'

export default class Firebase extends Db {
    constructor() {
        super();

        this.user = firebase.User;
    }

    getMyId() { return this.user.uid; }

    saveCoord(coord) {
        firebase.database().ref('users/' + this.user.uid).set({
            coord: coord
        });
    }

    saveBombCoord(coord) {}
}
