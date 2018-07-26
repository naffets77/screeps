/*

  Bootstrap manager gets a room up to controller level 4

*/

import { GameReferences } from 'models/game-references';
import { RoomManager } from '../room.manager';
import { SpawnRequest } from 'models/spawn-request';
import { BaseCreepManager } from './base.creep-manager';
import { WorkerRole } from '../../creep-roles/worker.role';
import { ScreepUtilsCreepBuilder } from 'utils/ScreepUtilsCreepBuilder';

export class BootstrapManager extends BaseCreepManager {
  private name: string = 'Bootstrap Manager';

  private roleName: string = 'BOOTSTRAPPER';
  private workerRole: WorkerRole;

  constructor(gameReference: GameReferences, roomManager: RoomManager) {
    super(gameReference, roomManager);
    this.workerRole = new WorkerRole();
  }
  public run() {
    super.run();
    const room: Room = this.rm.activeRoom;
    const creeps: Creep[] = this.gr.utilities.getCreepsByRole(room.name, this.roleName);
    const queuedCreeps: SpawnRequest[] = this.gr.spawnManager.getQueuedSpawnRequests(this.roleName, room.name);

    this.report(creeps, queuedCreeps);
    this.spawnCreep(creeps, queuedCreeps);
    this.assignCreeps(creeps);
  }

  private assignCreeps(creeps: Creep[]) {
    creeps.forEach(creep => {
      this.workerRole.process(creep);
    });
  }

  public report(creeps: Creep[], queuedCreeps: SpawnRequest[]) {
    if (this.gr.memoryManager.reportFlag) {
      console.log(' Bootstrap Manager Report');
      console.log(`  Creeps Count: ${creeps.length}`);
      console.log(`  Queued: ${queuedCreeps.length}`);
    }
  }

  private spawnCreep(creeps: Creep[], queuedCreeps: SpawnRequest[]) {
    const creepsToSpawn = this.getNumberOfCreepsToSpawn(creeps, queuedCreeps);
    if (creepsToSpawn > 0) {

      const energy = this.rm.activeRoom.energyAvailable > 600 ? 600 : this.rm.activeRoom.energyAvailable;
      const creepBodyParts = ScreepUtilsCreepBuilder.getBody(energy, {
        baseBody: [WORK, WORK, CARRY, MOVE],
        carry: 455,
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
          priority: 10,
          role: this.roleName,
          roomName: this.rm.getRoomName(),
          energyRequirements: ScreepUtilsCreepBuilder.calculateBodyEnergyRequirements(creepBodyParts),
          memoryProperties: {}
        });
      }
    }
  }

  private getNumberOfCreepsToSpawn(creeps: Creep[], queuedCreeps: SpawnRequest[]): number {
    // bootstrapper spawns creeps if
    // We don't have storage
    // We have storage but it's less than 5000 (or some percentage based on controller level)
    const createCreeps = !this.rm.activeRoom.storage || (this.rm.activeRoom.storage && this.rm.activeRoom.storage.store.energy < 2000);
    return createCreeps ? 6 - (creeps.length + queuedCreeps.length) : 0;
  }
}
