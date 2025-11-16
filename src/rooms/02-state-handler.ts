import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
    @type("int8")
    skin = 0;

    @type("number")
    x = Math.floor(Math.random() * 256) - 128;

    @type("number")
    z = Math.floor(Math.random() * 256) - 128;

    @type("uint8")
    d = 2;
}

export class State extends Schema {
    @type({ map: Player })
    players = new MapSchema<Player>();

    something = "This attribute won't be sent to the client-side";

    createPlayer(sessionId: string, skin: number) {
        const player = new Player();
        player.skin = skin;
        this.players.set(sessionId, player);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    movePlayer (sessionId: string, movement: any) {
        this.players.get(sessionId).x = movement.x;
        this.players.get(sessionId).z = movement.z;
    }
}

export class StateHandlerRoom extends Room<State> {
    maxClients = 1000;
    skins: number[] = [0]

    onCreate (options) {
        console.log("StateHandlerRoom created!", options);

        for (var i = 1; i < options.skins; i++){
            this.skins.push(i)
        }

        this.setState(new State());

        this.onMessage("move", (client, data) => {
            this.state.movePlayer(client.sessionId, data);
        });
    }

    onAuth(client, options, req) {
        return true;
    }

    onJoin (client: Client) {
        const randomIndex = Math.floor(Math.random() * this.skins.length);
        const skin = this.skins[randomIndex];
        this.state.createPlayer(client.sessionId, skin);
    }

    onLeave (client) {
        this.state.removePlayer(client.sessionId);
    }

    onDispose () {
        console.log("Dispose StateHandlerRoom");
    }

}
