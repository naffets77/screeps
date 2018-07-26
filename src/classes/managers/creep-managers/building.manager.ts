import { GameReferences } from 'models/game-references';
import { RoomManager } from '../room.manager';
import { JobResourceUtilities } from 'utils/job/job-resource.utilities';

// responsible for making sure buildings are build
// responsibile for making sure buildings are repaired

export class BuildingManager implements Runnable {
  private name: string = 'Work Manager';
  private gr: GameReferences;
  private rm: RoomManager;

  private role: string = 'BUILDER';
  private maxCreepCount = 3;

  private bodyParts: BodyPartConstant[]; // should load/retrieve from memory cache

  constructor(gameReference: GameReferences, roomManager: RoomManager) {
    this.gr = gameReference;
    this.rm = roomManager;
    this.bodyParts = this.generateBodyParts();
  }

  // should prob be a utility
  private generateBodyParts(): BodyPartConstant[] {
    // @ts-ignore
    const room: Room = Game.rooms[this.rm.getRoomName()];

    // this isn't very accurate because we don't necessarily want to blow all our energy
    // all the time...
    return this.getOptimalBody(room.energyAvailable - 200); // room.energyAvailable
  }

  public run() {
    let builderCount = null;
    // @ts-ignore
    const queuedCount: SpawnRequest[] = this.gr.spawnManager.getQueuedSpawnRequests(this.role, this.rm.getRoomName());

    if (this.gr.memoryManager.reportFlag) {
      builderCount = this.updateBuilderCount();

      console.log(` BuilderManager Report`);
      console.log('  Buildings in need of repair: ' + this.getHurtBuildingsCount());
      console.log('  Buildins under construction: ' + this.getUnderContructionCount());
      console.log(`  Builders: ${builderCount}, Queued: ${queuedCount.length}`);
      // const creepCount = this.gr.utilities.getCreepCount(this.roleName);
      // console.log(`Updating Counts ${this.roleName} : ${creepCount}`);
      // this.gr.memoryManager.infoTracker.creepTracker[this.roleName].count = creepCount;
    }

    // need to check if there are buildings missing that we should have based on blueprint
    // need to check if there are any creeps that are builders

    if (builderCount != null && this.getBuilderTargetQuantity() > builderCount + queuedCount.length) {
      this.handleCreateSpawnRequest(builderCount, queuedCount.length);
    }

    const idleBuilders = this.getIdleBuilders();
    console.log('IDLE BUILDERS: ' + idleBuilders.length);
    for (const builder of idleBuilders) {
      if (builder.carry.energy > 0) {
        // get closest list of buildings that need to be repaired
        const targetRepair = builder.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure: Structure) => {
            let targetHitsToRepair = structure.hitsMax * 0.8;
            if (structure.structureType === STRUCTURE_WALL) {
              targetHitsToRepair = 100000;
            }


            return structure.hits < targetHitsToRepair; // if it's 60% dead repair it
          }
        });

        // reset memory for now until new creeps exist
        // @ts-ignore
        builder.memory.jobTargetIds = [];

        // figure out how to prioritize these

        console.log('FINDING WORK FOR BUILDERS');
        const targetConstruction = builder.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);

        if (this.rm.getRoomEnergyPercentage() < 0.8) {
          JobResourceUtilities.refillRoomCapacity(builder, this.rm.activeRoom, null);
        } else if (targetRepair) {
          // @ts-ignore
          builder.memory.job = 'Repair';
          builder.say('Repairing!');
          // @ts-ignore
          builder.memory.jobTargetIds.push(targetRepair.id);
        } else if (targetConstruction) {
          // @ts-ignore
          builder.memory.job = 'BuildStructure';
          builder.say('Building!');
          // @ts-ignore
          builder.memory.jobTargetIds.push(targetConstruction.id);
        } else {
          JobResourceUtilities.refillRoomCapacity(builder, this.rm.activeRoom, null);
        }
        //  else {
        //   // @ts-ignore
        //   const sourceStructure: StructureContainer = builder.pos.findClosestByPath(FIND_STRUCTURES, {
        //     filter: (structure: Structure) => {
        //       return structure.structureType === STRUCTURE_CONTAINER;
        //     }
        //   });

        //   // @ts-ignore
        //   const targetStructure: StructureStorage = builder.room.storage;

        //   if (sourceStructure && targetStructure) {
        //     // @ts-ignore
        //     builder.memory.job = 'ResourceTransfer';
        //     builder.say('Assigned Job Tranfer Resource');
        //     // @ts-ignore
        //     builder.memory.jobTargetIds.push(sourceStructure.id);
        //     // @ts-ignore
        //     builder.memory.jobTargetIds.push(targetStructure.id);
        //     // @ts-ignore
        //     builder.memory.jobMisc = RESOURCE_ENERGY;
        //   }
        // }
      } else {
        // @ts-ignore
        builder.memory.job = 'GetEnergy';
      }
    }

    if (this.gr.memoryManager.reportFlag) {
      console.log(` completed : ${Game.cpu.getUsed()}`);
    }
  }

  public handleCreateSpawnRequest(builderCount: number, queuedCount: number) {
    const difference = this.getBuilderTargetQuantity() - builderCount + queuedCount;
    for (let i = 0; i < difference; i++) {
      // @ts-ignore
      this.gr.spawnManager.createSpawnRequest({
        bodyParts: this.bodyParts,
        priority: this.getBuilderSpawnPriority,
        role: this.role,
        roomName: this.rm.getRoomName(),
        energyRequirements: this.gr.utilities.calculateBodyEnergyRequirements(this.bodyParts)
      });
    }
  }

  public getBuilderSpawnPriority() {
    return 5;
  }

  public getBuilderTargetQuantity() {
    return 2;
  }

  // we can probably abstract this into the utility
  public updateBuilderCount() {
    let count = 0;
    for (const creepName in Game.creeps) {
      const creep: Creep = Game.creeps[creepName];
      // @ts-ignore
      if (creep.memory.room === this.rm.getRoomName() && creep.memory.role === this.role) {
        count++;
      }
    }

    return count;
  }

  private getHurtBuildingsCount(): number {
    // @ts-ignore
    const room: Room = Game.rooms[this.rm.getRoomName()];

    const structures = room.find(FIND_STRUCTURES, {
      filter: structure => {
        return structure.hits < structure.hitsMax * 0.8;
      }
    });

    return structures ? structures.length : 0;
  }

  private getUnderContructionCount(): number {
    // @ts-ignore
    const room: Room = Game.rooms[this.rm.getRoomName()];
    const structures = room.find(FIND_CONSTRUCTION_SITES);
    return structures ? structures.length : 0;
  }

  // another utility method
  private getIdleBuilders(): Creep[] {
    // @ts-ignore
    const selectedCreep: Creep[] = [];

    for (const creepName in Game.creeps) {
      const creep: Creep = Game.creeps[creepName];
      // @ts-ignore
      if (creep.memory.room === this.rm.getRoomName() && creep.memory.role === this.role && creep.memory.job === 'Idle') {
        selectedCreep.push(creep);
      }
    }

    return selectedCreep;
  }

  // abstract this w/ratio's?
  private getOptimalBody(energy: number): BodyPartConstant[] {
    let bodyParts: BodyPartConstant[] = [];

    if (energy > 300) {
      const carryCount = 1 + Math.floor(energy / 600);
      const workCount = Math.floor(energy / 150);
      const moveCount = 2 + Math.floor(energy / 250);

      this.addBodyParts(bodyParts, carryCount, CARRY);
      this.addBodyParts(bodyParts, workCount, WORK);
      this.addBodyParts(bodyParts, moveCount, MOVE);
    } else {
      bodyParts = [WORK, WORK, MOVE, CARRY];
    }

    return bodyParts;
  }

  private addBodyParts(bodyParts: BodyPartConstant[], count: number, type: BodyPartConstant) {
    for (let i = 0; i < count; i++) {
      bodyParts.push(type);
    }
  }
}
