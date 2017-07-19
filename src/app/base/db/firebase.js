
import Db from 'app/base/db/db'

const PLAYERS_PATH = 'users/'

export default class Firebase extends Db {
    constructor() {
        super();

        this.user = firebase.auth().currentUser;
        this.database = firebase.database();
    }

    getMyId() { return this.user.uid; }

    getExistingPlayers(callback) {
        this.database.ref(PLAYERS_PATH).once("value", (data) => {
            let children = data.val();
            for (let key of Object.keys(children)) {
                if (key != this.getMyId()) {
                    children[key].key = key;
                    callback(children[key]);
                }
            }
        });
    }

    onNewPlayer(callback) {
        this.database.ref(PLAYERS_PATH).on("child_added", (data, prevChildKey) => {
            if (data.key != this.getMyId()) {
                callback(data);
            }
        });
    }

    onPlayerUpdate(callback) {
        this.database.ref(PLAYERS_PATH).on("child_changed", (data, prevChildKey) => {
            if (data.key != this.getMyId()) {
                callback(data);
            }
        });
    }

    onPlayerExit(callback) {
        this.database.ref(PLAYERS_PATH).on("child_removed", callback);
    }

    getPlayerInfo(userId, callback) {
        this.database.ref(PLAYERS_PATH + userId).once('value').then(function(snapshot) {
            callback(snapshot.val());
        });
    }

    savePlayerInfo(player) {
        this.database.ref(PLAYERS_PATH + this.getMyId()).set({
            name: player.getName(),
            coord: player.getCoord(),
            type: player.getType(),
            kills: player.getKills(),
            deaths: player.getDeaths()
        });
    }

    savePlayerKilledInfo(player) {
        this.database.ref(PLAYERS_PATH + this.getMyId()).set({
            name: player.getName(),
            coord: player.getCoord(),
            type: player.getType(),
            kills: player.getKills(),
            deaths: player.getDeaths(),
            killedBy: player.getKilledBy()
        });
    }

    updatePlayerBombs(bombs) {
        let update = {};
        update[PLAYERS_PATH + this.getMyId() + '/bombs'] = bombs;
        this.database.ref().update(update);
    }
}
