import { GameReferences } from 'models/game-references';
import { RoomManager } from '../room.manager';
import { ScreepUtilsCreepBuilder } from 'utils/ScreepUtilsCreepBuilder';
import { SpawnRequest } from 'models/spawn-request';
import { UpgradeControllerJob } from '../../creep-jobs/controller/upgrade-controller.job';

export class ControllerManager implements Runnable {
  private name: string = 'Controller Manager';
  private gr: GameReferences;
  private rm: RoomManager;

  private roleName: string = 'CONTROLLER';

  constructor(gameReference: GameReferences, roomManager: RoomManager) {
    this.gr = gameReference;
    this.rm = roomManager;
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
    const idleCreeps = this.gr.utilities.getIdleCreeps(creeps);

    for (const idleCreep of idleCreeps) {
      // search for containers - order by distance from the controller

      if (this.rm.getRoomEnergyPercentage() < 0.3) {
        this.assignExcessHaulerSubRole(idleCreep, this.rm.activeRoom);
      } else if (idleCreep.carry.energy > 0) {
        (idleCreep.memory as any).job = UpgradeControllerJob.jobName;
      } else {
        // @ts-ignore
        const energyTarget: Structure = idleCreep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure: any) => {
            return (
              (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) &&
              structure.store.energy > 0
            );
          }
        });

        (idleCreep.memory as any).job = 'GetEnergy';
        (idleCreep.memory as any).jobTargetIds = [energyTarget.id];
      }
    }
  }

  private report(creeps: Creep[], queuedCreeps: SpawnRequest[]) {
    if (this.gr.memoryManager.reportFlag) {
      console.log(' ControllerManager Report');
      console.log(`  Creeps Count: ${creeps.length}`);
      console.log(`  Queued: ${queuedCreeps.length}`);
    }
  }

  private CPUUsageReport() {
    if (this.gr.memoryManager.reportFlag) {
      console.log(` completed : ${Game.cpu.getUsed()}`);
    }
  }

  private getNumberOfCreepsToSpawn(creeps: Creep[], queuedCreeps: SpawnRequest[]): number {
    return 4 - (creeps.length + queuedCreeps.length);
  }

  private spawnCreep(creeps: Creep[], queuedCreeps: SpawnRequest[]) {
    const creepsToSpawn = this.getNumberOfCreepsToSpawn(creeps, queuedCreeps);

    // console.log('number of creeps to spawn ' + creepsToSpawn);

    if (creepsToSpawn > 0) {
      const creepBodyParts = ScreepUtilsCreepBuilder.getBody(1300, {
        baseBody: [WORK, WORK, CARRY, MOVE],
        carry: 450,
        carryMinimum: 1,
        move: 405,
        moveMinimum: 1,
        work: 200,
        workMinimum: 1
      });

      for (let i = 0; i < creepsToSpawn; i++) {
        console.log('Triggering Spawn');
        // @ts-ignore
        this.gr.spawnManager.createSpawnRequest({
          bodyParts: creepBodyParts,
          priority: 10,
          role: this.roleName,
          roomName: this.rm.getRoomName(),
          energyRequirements: ScreepUtilsCreepBuilder.calculateBodyEnergyRequirements(creepBodyParts),
          memoryProperties: {}
        });
      }

      console.log('Complete Controller Spawn');
    }
  }
  private assignExcessHaulerSubRole(creep: Creep, room: Room) {
    // find empty containers to fill with energy
    const container: Structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => {
        let result: boolean = true;
        if (
          (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
          structure.energy < structure.energyCapacity
        ) {
          result = true;
        } else {
          result = false;
        }
        return result;
      }
    }) as Structure;

    if (room.storage && container) {
      this.setupHaulerJob(creep, room, room.storage.id, container.id, false, null);
    }
    // move energy from storage to the container
  }

  private setupHaulerJob(creep: Creep, room: Room, sourceStructureId: string, targetStructureId: string, repeatJob: boolean, node?: any) {
    (creep.memory as any).job = 'ResourceTransfer';

    (creep.memory as any).jobMisc = {
      resourceType: RESOURCE_ENERGY,
      repeat: repeatJob,
      resourceId: node ? node.resourceId : null
    };

    (creep.memory as any).jobTargetIds = [sourceStructureId, targetStructureId];

    creep.say('Hauling!');
  }
}
