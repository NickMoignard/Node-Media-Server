export let sessions: Map<any, any>;
export let publishers: Map<any, any>;
export let idlePlayers: Set<any>;
export let nodeEvent: EventEmitter;
export namespace stat {
    const inbytes: number;
    const outbytes: number;
    const accepted: number;
}
import EventEmitter = require("events");
