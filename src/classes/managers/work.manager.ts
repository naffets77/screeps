import { GameReferences } from 'models/game-references';
import { SpawnManager } from './spawn.manager';
import { RepairJob } from '../creep-jobs/repair.job';
import { GetEnergyJob } from '../creep-jobs/get-energy.job';
import { BuildStructureJob } from '../creep-jobs/build-structure.job';
import { RenewJob } from '../creep-jobs/renew.job';
import { ResourceTransferJob } from '../creep-jobs/resource-transfer.job';
import { HarvestJob } from '../creep-jobs/harvest.job';
import { UpgradeControllerJob } from '../creep-jobs/controller/upgrade-controller.job';
import { MoveToRoomJob } from '../creep-jobs/move-to-room.job';

export class WorkManager implements Runnable {
  private name: string = 'Work Manager';
  private gr: GameReferences;

  private roleName: string = 'WORKER';
  private maxCreepCount = 1;

  constructor(gameReference: GameReferences) {
    this.gr = gameReference;
  }

  public run() {
    if (this.gr.memoryManager.reportFlag) {
      const creepCount = this.gr.utilities.getCreepCount(this.roleName);
      console.log(`Updating Counts ${this.roleName} : ${creepCount}`);
      this.gr.memoryManager.infoTracker.creepTracker[this.roleName].count = creepCount;
    }

    const count = parseInt(this.gr.memoryManager.infoTracker.creepTracker[this.roleName].count, 10);
    if (this.shouldSpawn() && count < this.maxCreepCount) {
      const result = this.gr.spawnManager.spawn(this.roleName, [WORK, WORK, CARRY, MOVE], count + 1);
      if (result) {
        this.gr.memoryManager.infoTracker.creepTracker[this.roleName].count = count + 1;
      }
    }
  }

  private getObjectById(creep: Creep, id: string): any {
    const result = Game.getObjectById(id);
    if (result == null) {
      throw new Error('Game Object not found');
    }
    return result;
  }

  public processJob(creep: Creep) {
    let jobComplete: boolean = false;

    // if at anypoint the creep is running out of tics to live, we'll save it unless it has some sort of override (tbd)
    if ((!creep.spawning && (creep.ticksToLive && creep.ticksToLive < 100)) || (creep.memory as any).renew) {
      // jobComplete = this.renewCreep(creep);
      // return;
    }

    switch ((creep.memory as any).job) {
      case 'GetEnergy':
        const target =
          (creep.memory as any).jobTargetIds.length > 0
            ? this.getObjectById(creep, (creep.memory as any).jobTargetIds)
            : creep.room.storage;
        jobComplete = GetEnergyJob.process(creep, target as Structure<StructureConstant>);
        break;
      case 'Harvest':
        const pos = new RoomPosition((creep.memory as any)['jobMisc'].pos.x, (creep.memory as any)['jobMisc'].pos.y, 'sim');
        jobComplete = HarvestJob.process(creep, pos, this.getObjectById(creep, (creep.memory as any).jobTargetIds[0]));
        break;
      case 'Repair':
        jobComplete = RepairJob.process(creep, this.getObjectById(creep, (creep.memory as any).jobTargetIds[0]));
        break;
      case 'BuildStructure':
        try {
          if ((creep.memory as any).jobTargetIds) {
            jobComplete = BuildStructureJob.process(creep, this.getObjectById(creep, (creep.memory as any).jobTargetIds[0]));
          }
        } catch (error) {
          console.log('Error Building Structure, Most likely structure was completed already! Completing Job.');
          jobComplete = true;
        }
        break;
      case 'ResourceTransfer':
        jobComplete = ResourceTransferJob.process(
          creep,
          (creep.memory as any).jobMisc.resourceType,
          this.getObjectById(creep, (creep.memory as any).jobTargetIds[0]),
          this.getObjectById(creep, (creep.memory as any).jobTargetIds[1]),
          (creep.memory as any).jobMisc.repeat
        );
        break;
      case UpgradeControllerJob.jobName:
        // console.log('Moving to :' + JSON.stringify(creep.room.controller));
        if (creep.room.controller) {
          jobComplete = UpgradeControllerJob.process(creep, creep.room.controller);
        }
        break;
      case 'ScoutRoom':
        jobComplete = MoveToRoomJob.process(creep, (creep.memory as any).jobTargetIds[0], (creep.memory as any).jobTargetIds[1]);
        break;
      case 'Idle':
        creep.moveTo(Game.flags['IdleFlag']);
        break;
    }

    if (jobComplete) {
      this.cleanupCreep(creep);
    }
  }

  private renewCreep(creep: Creep): boolean {
    const closestSpawn: StructureSpawn = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => {
        return structure.structureType === STRUCTURE_SPAWN;
      }
    }) as StructureSpawn;

    return RenewJob.process(creep, closestSpawn);
  }

  private shouldSpawn(): boolean {
    return this.gr.utilities.energyAvailabile() === this.gr.utilities.energyCapacity();
  }

  private cleanupCreep(creep: Creep) {
    (creep.memory as any).job = 'Idle';
    (creep.memory as any).jobTargetIds = [];
    (creep.memory as any).jobStatus = 'Init';
    (creep.memory as any).jobMisc = null;
    (creep.memory as any).renew = false;
  }
}
