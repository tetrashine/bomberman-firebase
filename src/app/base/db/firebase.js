
import Db from 'app/base/db/db'

export default class Firebase extends Db {
    constructor() {
        super();

        this.user = firebase.auth().currentUser;
    }

    getMyId() { return this.user.uid; }

    savePlayerCoord(coord) {
        firebase.database().ref('users/' + this.getMyId()).set({
            coord: coord
        });
    }

    saveBombCoord(coord) {}
}
