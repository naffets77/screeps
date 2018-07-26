import { GameReferences } from 'models/game-references';
import { RoomControllerDefinition } from 'models/lookup-definitions/room-controller.definition';
import { RoomControllerLookup } from 'lookups/room-controller.lookup';
import { MAP_W7N7 } from 'lookups/maps/W7N7.maps';
import { ScreepUtils } from 'utils/ScreepUtils';
import { MemoryManager } from './memory.manager';
import { SpawnManager } from './spawn.manager';
import { RoomManager } from './room.manager';
import { MemoryInfoTracker } from 'models/memory-info-tracker';
import { ExternalRoomManager } from './world-managers/external-room.manager';
import { ScoutManager } from './creep-managers/scout.manager';
import { OvermindManager } from './world-managers/overmind-manager/overmind.manager';

export class WorldManager implements Runnable {
  private memTrackerHash: string = 'TRACKERS';
  private memTracker: MemoryInfoTracker;
  private gr: GameReferences;
  private maps = {
    W7N7: MAP_W7N7
  };

  private roomManager: RoomManager;
  private externalRoomManager: ExternalRoomManager;
  private overmind: OvermindManager;

  constructor() {
    this.memTracker = Memory[this.memTrackerHash] as MemoryInfoTracker;
    this.initMemoryTracker();

    this.gr = new GameReferences();
    this.overmind = new OvermindManager();
    this.externalRoomManager = new ExternalRoomManager();
    this.roomManager = new RoomManager(this.gr, this.overmind);

    // iterate over the list of rooms, if we have plans for them we'll load the plan otherwise
    // we'll have default behaviors.

    for (const room in Game.rooms) {
      // @ts-ignore
      if (this.maps[room]) {
        // @ts-ignore
        this.gr.memoryManager.pushRoomInfo(this.maps[room]);
      }
    }
  }

  public run() {
    this.gr.memoryManager.run();

    const roomManager = this.roomManager;

    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      // externalManager.process(room);
      this.report(room.name);

      this.externalRoomManager.process(room);

      roomManager.setRoom(room);
      roomManager.run();
    }

    this.gr.spawnManager.run();

    if (this.gr.memoryManager.updateMemory) {
      this.gr.memoryManager.updateMemory();
    }
  }

  public report(room: string) {
    if (this.gr.memoryManager.reportFlag) {
      console.log('World Manager - Processing Room : ' + room);
    }
  }

  private initMemoryTracker() {
    if (!this.memTracker) {
      this.memTracker = {
        EXT_ROOM_TRACKER: ExternalRoomManager.initMemoryTracker(),
        SCOUT_TRACKER: ScoutManager.initMemoryTracker()
      };
      Memory[this.memTrackerHash] = this.memTracker;
    }
  }
}
