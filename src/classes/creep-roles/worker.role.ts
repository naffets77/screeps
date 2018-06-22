export class WorkerRole {
  public process(creep: Creep) {
    // ideally the creep would request a job
    // the job would set an enum for what it's currently doing
    // to complete that job... i.e. get energy, build soemthing, etc...
    // a job might be a sequence of things to do..?

    // this is our fugly way of doing work

    if (creep.carry.energy === 0) {
      // @ts-ignore
      creep.memory.dumpEnergy = false;
    }

    if (creep.ticksToLive && creep.ticksToLive > 1400) {
      // @ts-ignore
      creep.memory.renew = false;
    }

    // @ts-ignore
    if (creep.carry.energy < creep.carryCapacity && creep.memory.dumpEnergy === false) {
      this.harvestEnergy(creep);
    } else {
      // @ts-ignore
      creep.memory.dumpEnergy = true;

      //// Super unoptimal....
      // @ts-ignore
      // const targetConstructionSites = creep.room.find(FIND_CONSTRUCTION_SITES, {
      //   filter: { structureType: STRUCTURE_EXTENSION}
      // });

      // @ts-ignore
      const targetConstructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);

      const energyTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure => {
          return (
            (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
            structure.energy < structure.energyCapacity
          );
        }
      });

      // @ts-ignore
      if (creep.spawning === false && creep.ticksToLive && (creep.ticksToLive < 50 || creep.memory.renew)) {
        this.renewCreep(creep);
      } else if (energyTarget) {
        this.storeEnergy(creep, energyTarget);
        // } else if (targetConstructionSite) {
        //   this.buildConstructionSite(creep, targetConstructionSite);
      } else if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] < 3000) {
        this.storeEnergy(creep, creep.room.storage);
      } else {
        const controller = creep.room.controller;
        if (controller) {
          this.upgradeController(creep, controller);
        }
      }
    }
  }

  private buildConstructionSite(creep: Creep, target: any) {
    if (creep.build(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }

  private upgradeController(creep: Creep, roomController: StructureController) {
    if (creep.upgradeController(roomController) === ERR_NOT_IN_RANGE) {
      creep.moveTo(roomController);
    }
  }

  private storeEnergy(creep: Creep, target: any) {
    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
    }
  }

  private renewCreep(creep: Creep) {
    // @ts-ignore
    creep.memory.renew = true;
    const spawn = Game.spawns['SPAWN_1'];
    if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn.pos);
    }
  }

  private harvestEnergy(creep: Creep) {
    const storage = creep.room.storage;

    // @ts-ignore
    const targetIndex: number = creep.memory.role === 'WORKER' ? 0 : 1; // hack to get harvester's to go to the further energy source

    // @ts-ignore
    if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      // @ts-ignore
      creep.moveTo(storage);
    }
  }
}

/*
  Things I want to do...

  1. Upgrade Controller
  2. Build Extentions (As many as I can, when I can ...)
*/
