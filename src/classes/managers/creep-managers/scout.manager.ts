import { GameReferences } from 'models/game-references';
import { RoomManager } from '../room.manager';
import { SpawnRequest } from 'models/spawn-request';
import { BaseCreepManager } from './base.creep-mamager';
import { ScreepUtilsCreepBuilder } from 'utils/ScreepUtilsCreepBuilder';
import { ExternalRooms } from 'models/world-manager/external-room-manager/external-rooms';
import { PrimaryRooms } from 'models/world-manager/external-room-manager/primary-rooms';
import { ExternalRoom } from 'models/world-manager/external-room-manager/external-room';
import { ScoutManagerMemoryTracker } from 'models/creep-managers/scout-manager/scout-manager-memory-tracker';
import { ExternalRoomTracker } from 'models/creep-managers/scout-manager/external-room-tracker';
import { ExternalRoomTrackers } from 'models/creep-managers/scout-manager/external-room-trackers';

export class ScoutManager extends BaseCreepManager implements Runnable {
  private maxTicToScoutRoom = 3000; // decrease to scout rooms more often

  private name: string = 'Scout Manager';
  private roleName: string = 'SCOUT';
  private scoutTracker: ScoutManagerMemoryTracker;

  constructor(gameReference: GameReferences, roomManager: RoomManager) {
    super(gameReference, roomManager);

    this.scoutTracker = Memory['TRACKERS']['SCOUT_TRACKER'];
    this.processExternalRoomsToScout();
  }

  public run() {
    const room: Room = this.rm.activeRoom;
    const creeps: Creep[] = this.gr.utilities.getCreepsByRole(room.name, this.roleName);
    const queuedCreeps: SpawnRequest[] = this.gr.spawnManager.getQueuedSpawnRequests(this.roleName, room.name);

    this.report(creeps, queuedCreeps);
    this.spawnCreep(creeps, queuedCreeps);
    this.assignCreeps(creeps);

    this.CPUUsageReport();
  }

  private assignCreeps(creeps: Creep[]) {
    const idleCreeps: Creep[] = this.gr.utilities.getIdleCreeps(creeps);

    // console.log('Idle scout count ' + idleCreeps.length);
    for (const idleCreep of idleCreeps) {
      const room: ExternalRoomTracker = this.getRoomToScout();

      if (room) {
        console.log('Scouting room... ' + room.roomName);
        (idleCreep.memory as any).job = 'ScoutRoom';
        (idleCreep.memory as any).jobTargetIds = [this.rm.getRoomName(), room.roomName];
        room.assignedCreepId = idleCreep.id;
      }
      // (idleCreep.memory as any).jobTargetIds = [Game.map.findExit(this.rm.getRoomName(), this.externalRoomsToScout[0].)]
    }
  }

  private getNumberOfCreepsToSpawn(creeps: Creep[], queuedCreeps: SpawnRequest[]): number {
    return 1 - (creeps.length + queuedCreeps.length); // Math.floor(this.externalRoomsToScout.length / 2) - (creeps.length + queuedCreeps.length);
  }

  private spawnCreep(creeps: Creep[], queuedCreeps: SpawnRequest[]) {
    const creepsToSpawn = this.getNumberOfCreepsToSpawn(creeps, queuedCreeps);

    if (creepsToSpawn > 0) {
      const creepBodyParts = ScreepUtilsCreepBuilder.getBody(300, {
        baseBody: [MOVE],
        carry: 450,
        carryMinimum: 1,
        move: 405,
        moveMinimum: 1,
        work: 200,
        workMinimum: 1
      });

      for (let i = 0; i < creepsToSpawn; i++) {
        // @ts-ignore
        this.gr.spawnManager.createSpawnRequest({
          bodyParts: creepBodyParts,
          priority: 15,
          role: this.roleName,
          roomName: this.rm.getRoomName(),
          energyRequirements: ScreepUtilsCreepBuilder.calculateBodyEnergyRequirements(creepBodyParts),
          memoryProperties: {}
        });
      }
    }
  }

  private report(creeps: Creep[], queuedCreeps: SpawnRequest[]) {
    if (this.gr.memoryManager.reportFlag) {
      console.log(` ${this.name} Report`);
      console.log(`  Creeps Count: ${creeps.length}`);
      console.log(`  Queued: ${queuedCreeps.length}`);
    }
  }

  public static initMemoryTracker(): ScoutManagerMemoryTracker {
    return { rooms: {} };
  }
  public static completeJob(creep: Creep) {}

  /// utilities specific to manager

  private processExternalRoomsToScout() {
    const externalRooms: ExternalRooms = this.gr.externalRoomManager.tracker.rooms[this.rm.getRoomName()];
    for (const externalRoomName in externalRooms) {
      const externalRoom: ExternalRoom = externalRooms[externalRoomName];

      // if (externalRoom.lastSeenTic === -1 || Game.time - externalRoom.lastSeenTic > this.maxTicToScoutRoom) {
      // don't have it -> Initialize it
      if (!this.scoutTracker.rooms[externalRoomName]) {
        this.scoutTracker.rooms[externalRoomName] = {
          lastSeenTic: externalRoom.lastSeenTic,
          roomName: externalRoomName
        };
      } else {
        // we have it -> update the last seen tic to know when we want to scout it next
        this.scoutTracker.rooms[externalRoomName].lastSeenTic = externalRoom.lastSeenTic;

        if (this.scoutTracker.rooms[externalRoomName].assignedCreepId) {
          const creep = Game.getObjectById(this.scoutTracker.rooms[externalRoomName].assignedCreepId);
          if (creep && ((creep as Creep).memory as any).job === 'Idle') {
            this.scoutTracker.rooms[externalRoomName].assignedCreepId = undefined;
          }
        }
      }
      // }
    }
  }

  private getRoomToScout(): ExternalRoomTracker {
    // console.log('Getting room to scout');

    // @ts-ignore
    let roomToFind: ExternalRoomTracker = null;
    for (const externalRoomTrackerName in this.scoutTracker.rooms) {
      const externalRoomTracker = this.scoutTracker.rooms[externalRoomTrackerName];

      console.log(
        `${externalRoomTracker.roomName} Last Seen Tic: ${externalRoomTracker.lastSeenTic} | ${Game.time - externalRoomTracker.lastSeenTic}`
      );
      if (
        externalRoomTracker.lastSeenTic === -1 ||
        (Game.time - externalRoomTracker.lastSeenTic > this.maxTicToScoutRoom && !externalRoomTracker.assignedCreepId)
      ) {
        console.log('chosen room to find: ' + JSON.stringify(externalRoomTracker));
        roomToFind = externalRoomTracker;
      }
    }

    return roomToFind;
  }
}
