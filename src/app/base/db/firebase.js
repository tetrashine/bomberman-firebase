
import Db from 'app/base/db/db'

const PLAYERS_PATH = 'users/'

export default class Firebase extends Db {
    constructor() {
        super();

        this.user = firebase.auth().currentUser;
        this.database = firebase.database();
    }

    getMyId() { return this.user.uid; }

    getExistingPlayers(func) {
        this.database.ref(PLAYERS_PATH).once("value", (data) => {
            let children = data.val();
            for (let key of Object.keys(children)) {
                if (key != this.getMyId()) {
                    children[key].key = key;
                    func(children[key]);
                }
            }
        });
    }

    onNewPlayer(func) {
        this.database.ref(PLAYERS_PATH).on("child_added", (data, prevChildKey) => {
            if (data.key != this.getMyId()) {
                func(data);
            }
        });
    }

    onPlayerUpdate(func) {
        this.database.ref(PLAYERS_PATH).on("child_changed", (data, prevChildKey) => {
            if (data.key != this.getMyId()) {
                func(data);
            }
        });
    }

    onPlayerExit(func) {
        this.database.ref(PLAYERS_PATH).on("child_removed", func);
    }

    savePlayerInfo(player) {
        this.database.ref(PLAYERS_PATH + this.getMyId() + '/coord').set(player.getCoord());
        this.database.ref(PLAYERS_PATH + this.getMyId() + '/type').set(player.getType());
    }

    updatePlayerBombs(bombs) {
        let update = {};
        update[PLAYERS_PATH + this.getMyId() + '/bombs'] = bombs;
        this.database.ref().update(update);
    }
}
