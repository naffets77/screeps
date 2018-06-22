import { ExternalRoomManagerMemoryTracker } from 'models/world-manager/external-room-manager/external-room-manager-memory-tracker';
import { ExternalRooms } from 'models/world-manager/external-room-manager/external-rooms';
import { PrimaryRooms } from 'models/world-manager/external-room-manager/primary-rooms';
import { InfoTrackerBase } from 'models/info-tracker/info-tracker.base';
import { ExternalRoomObject } from 'models/world-manager/external-room-manager/external-room-object';

/*
  This manager will help determine what to do with world resources. It will receive a room that
  has the capabilities to build and access resources in other rooms, and determine the best (closest/safest)
  nearby rooms to get additional resources from.

  For now ..

  1. Resources that are close
  2. Controller that is close
  3. No Spawners in the room

  ... TBD ...

  Handling multiple rooms.

  Process - Rooms for processing will be prepared one at a time

  0. Send Scout to other room (builder scout?)
  1. Build roads to the resources
  2. Build Containers near resources (If I can?)
  2. Build Gatherer + Haulers (Based on distance, but initially 1 per)
  3. Build a Controller to reserve the room

*/

export class ExternalRoomManager {
  public static memoryId = 'EXT_ROOM_TRACKER';
  public tracker: ExternalRoomManagerMemoryTracker;
  constructor() {
    this.tracker = Memory['TRACKERS'] ? Memory['TRACKERS'][ExternalRoomManager.memoryId] : null;
  }

  public process(room: Room) {
    const memTracker: ExternalRoomManagerMemoryTracker = this.tracker;

    // if room doesn exist -> init room as a primary room
    // otherwise check if it's null, and if we have visibility
    // if

    const roomNames: any = this.getNearbyRooms(room.name);
    for (const key in roomNames) {
      const name = roomNames[key];

      // console.log('Checking : ' + name);

      if (memTracker.rooms[room.name]) {
        // should update objects on some threshold for now we're always going to do it..
        if (name && Game.rooms[name]) {
          // if (name && memTracker.rooms[room.name][name].lastSeenTic === -1 && Game.rooms[name]) {
          // haven't seen it
          //  console.log('*** External Room Manager - Need to init external room: ' + name);
          ExternalRoomManager.initRoomForMemoryTracker(room.name, name, memTracker);
        } else if (name && memTracker.rooms[room.name][name] && Game.rooms[name]) {
          // we've seen it before -> And we have visibility (update??? Ignore??)
          // console.log('*** External room manager - found room: ' + name);
          memTracker.rooms[room.name][name].lastSeenTic = Game.time;
        }
      }
    }
  }

  private initExternalRoom(roomName: string) {}

  // later will have a value to pass this to see how far to search
  private getNearbyRooms(roomName: string): any {
    return Game.map.describeExits(roomName);
  }

  public static initMemoryTracker(): ExternalRoomManagerMemoryTracker {
    const newMemTracker: ExternalRoomManagerMemoryTracker = {
      rooms: {} as PrimaryRooms,
      externalObjects: []
    };

    for (const roomName in Game.rooms) {
      const room: Room = Game.rooms[roomName];

      // Set primary rooms
      if (room.find(FIND_MY_SPAWNS).length > 0) {
        newMemTracker.rooms[roomName] = {};

        console.log(`Found Primary Room ${roomName}`);

        const externalRooms: any = Game.map.describeExits(roomName);

        console.log(`Exits ${JSON.stringify(externalRooms)}`);

        for (const key in externalRooms) {
          const name = externalRooms[key];

          if (name) {
            ExternalRoomManager.initRoomForMemoryTracker(roomName, name, newMemTracker);
          }
        }
      } else {
        // if it's not showing up that means we have an object in it - need to add all the objects in the various arrays
        // set energy sources
        // set element sources
        // set controller sources
      }
    }
    return newMemTracker;
  }

  private static initRoomForMemoryTracker(primaryRoomName: string, name: string, newMemTracker: ExternalRoomManagerMemoryTracker) {
    const roomObjects: ExternalRoomObject[] = [];

    // we have visibility into the room -> find objects
    if (Game.rooms[name]) {
      const energySources: Source[] = Game.rooms[name].find(FIND_SOURCES) as Source[];
      const minerals: Mineral[] = Game.rooms[name].find(FIND_MINERALS) as Mineral[];

      const controller: StructureController[] = Game.rooms[name].find(FIND_STRUCTURES, {
        filter: (structure: Structure) => structure.structureType === STRUCTURE_CONTROLLER
      }) as StructureController[];

      for (const es of energySources) {
        roomObjects.push({
          id: es.id,
          type: RESOURCE_ENERGY
        });
      }

      for (const m of minerals) {
        roomObjects.push({
          id: m.id,
          type: m.mineralType
        });
      }

      if (controller.length > 0) {
        roomObjects.push({
          id: controller[0].id,
          type: STRUCTURE_CONTROLLER
        });
      }

      // add npc and non-npc buildings and enemy spawns??
    }
    newMemTracker.rooms[primaryRoomName][name] = {
      lastSeenTic: newMemTracker.rooms[primaryRoomName][name] ? Game.time : -1,
      roomObjects
    };
  }
}
