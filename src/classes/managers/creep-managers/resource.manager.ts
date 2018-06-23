import { GameReferences } from 'models/game-references';
import { SpawnRequest } from 'models/spawn-request';
import { RoomManager } from '../room.manager';

export class ResourceManager implements Runnable {
  private name: string = 'Resource Manager';
  private gr: GameReferences;
  private rm: RoomManager;

  private roleName: string = 'HARVESTER';
  private maxCreepCount = 5;
  private nodeReference: any = [];

  // private bodyPartsHauler: BodyPartConstant[]; // should load/retrieve from memory cache
  // private bodyPartsGatherer: BodyPartConstant[]; // should load/retrieve from memory cache

  constructor(gameReference: GameReferences, roomManager: RoomManager) {
    this.gr = gameReference;
    this.rm = roomManager;
    // this.bodyPartsHauler = this.generateBodyParts("hauler");
    // this.bodyPartsGatherer = this.generateBodyParts("gatherer");
  }

  public run() {
    this.initMemory();

    const room = Game.rooms[this.rm.getRoomName()];

    const energyNodes = this.getEnergyNodes();

    const creeps: Creep[] = this.gr.utilities.getCreepsByRole(room.name, this.roleName);
    const gatherers: Creep[] = this.gr.utilities.filterCreepsByMemoryProperty(creeps, 'resourceSubRole', 'GATHERER');
    const haulers: Creep[] = this.gr.utilities.filterCreepsByMemoryProperty(creeps, 'resourceSubRole', 'HAULER');
    const queuedCreeps: SpawnRequest[] = this.gr.spawnManager.getQueuedSpawnRequests(this.roleName, room.name);

    this.report(energyNodes, gatherers, haulers, queuedCreeps);

    if (this.rm.activeRoom.energyAvailable >= 600) {
      if (energyNodes && energyNodes.length * 2 + 1 > queuedCreeps.length + gatherers.length + haulers.length) {
        this.handleCreateSpawnRequest(energyNodes, queuedCreeps, haulers, gatherers);
      }
    }

    for (const creepName in creeps) {
      const creep: Creep = creeps[creepName];

      if ((creep.memory as any).job === 'Idle') {
        let assignedJob = false;

        for (const node of this.nodeReference) {
          if ((creep.memory as any).resourceSubRole === 'GATHERER' && node.gathererId == null) {
            this.assignGathererSubRole(creep, node, room);
            assignedJob = true;
            break;
          } else if ((creep.memory as any).resourceSubRole === 'HAULER' && node.haulerId == null) {
            this.assignHaulerSubRole(creep, node, room);
            assignedJob = true;
            break;
          }
        }

        // the extra energy hauler
        if (!assignedJob) {
          this.assignExcessHaulerSubRole(creep, room);
        }
      } else {
        // if it's not idle then update the node it's working on
        this.refreshNode(creep);
      }
    }

    // save back anything that was updated...
    Memory['RESOURCE_TRACKER'][room.name] = this.nodeReference;

    if (this.gr.memoryManager.reportFlag) {
      console.log(` completed : ${Game.cpu.getUsed()}`);
    }
  }

  private report(energyNodes: any, gatherers: Creep[], haulers: Creep[], queuedCreeps: SpawnRequest[]) {
    if (this.gr.memoryManager.reportFlag) {
      console.log(' ResourceManager Report');
      console.log(`  Resource Nodes: ${energyNodes ? energyNodes.length : 0}`);
      console.log(`  Gatherers: ${gatherers.length ? gatherers.length : 0}`);
      console.log(`  Haulers: ${haulers.length ? haulers.length : 0}`);
      console.log(`  Queued: ${queuedCreeps.length ? queuedCreeps.length : 0}`);

      this.updateNodes();
    }
  }

  /// SubRole

  private assignGathererSubRole(creep: Creep, node: any, room: Room) {
    (creep.memory as any).job = 'Harvest';
    (creep.memory as any).jobMisc = {
      pos: {
        x: node.harvesterPosition.x,
        y: node.harvesterPosition.y
      }
    };

    (creep.memory as any).jobTargetIds = [room.lookForAt(LOOK_SOURCES, node.pos.x, node.pos.y)[0].id];

    creep.say('Gathering!');

    node.gathererId = creep.id;
  }

  private assignHaulerSubRole(creep: Creep, node: any, room: Room) {
    const structures: Structure[] = room.lookForAt(LOOK_STRUCTURES, node.harvesterPosition.x, node.harvesterPosition.y);

    let structureId = null;
    if (structures.length === 1) {
      structureId = structures[0].id;
    } else {
      for (const structure of structures) {
        if (structure.structureType === STRUCTURE_CONTAINER) {
          structureId = structure.id;
          break;
        }
      }
    }

    if (structureId == null) {
      console.log('No container found for source...');
      return;
    }

    (creep.memory as any).job = 'ResourceTransfer';

    (creep.memory as any).jobMisc = {
      resourceType: RESOURCE_ENERGY,
      repeat: true,

      resourceId: node.resourceId
    };

    if (room.storage) {
      (creep.memory as any).jobTargetIds = [structureId, room.storage.id];
    } else {
      throw new Error('No Storage In Room - Need to code alternative');
    }

    creep.say('Hauling!');

    node.haulerId = creep.id;
  }

  private assignExcessHaulerSubRole(creep: Creep, room: Room) {
    // find empty containers to fill with energy
    const container: Structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => {
        let result: boolean = true;
        if (structure.structureType === STRUCTURE_CONTAINER && _.sum(structure.store) < structure.storeCapacity) {
          structure.pos.look();
          for (const node of this.nodeReference) {
            if (node.harvesterPosition.x === structure.pos.x && node.harvesterPosition.y === structure.pos.y) {
              result = false;
              break;
            }
          }
        } else if (
          (structure.structureType === STRUCTURE_EXTENSION ||
            structure.structureType === STRUCTURE_SPAWN ||
            structure.structureType === STRUCTURE_TOWER) &&
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

  /// Utilities

  private setupHaulerJob(creep: Creep, room: Room, sourceStructureId: string, targetStructureId: string, repeatJob: boolean, node?: any) {
    (creep.memory as any).job = 'ResourceTransfer';

    (creep.memory as any).jobMisc = {
      resourceType: RESOURCE_ENERGY,
      repeat: repeatJob,
      resourceId: node ? node.resourceId : null
    };

    if (room.storage) {
      (creep.memory as any).jobTargetIds = [sourceStructureId, targetStructureId];
    } else {
      throw new Error('No Storage In Room - Need to code alternative');
    }

    creep.say('Hauling!');
  }

  // should prob be a utility

  private generateBodyParts(type: string): BodyPartConstant[] {
    // @ts-ignore
    const room: Room = Game.rooms[this.rm.getRoomName()];

    // @ts-ignore
    let resultParts: BodyPartConstant[] = null;

    if (type === 'HAULER') {
      resultParts = this.getOptimalBodyHauler(room.energyAvailable);
    }

    if (type === 'GATHERER') {
      resultParts = this.getOptimalBodyHauler(room.energyAvailable);
    }

    return resultParts;
  }

  private refreshNode(creep: Creep) {
    for (const node of this.nodeReference) {
      // @ts-ignore
      if (creep.memory.resourceSubRole === 'GATHERER' && creep.memory.jobTargetIds[0] === node.resourceId) {
        // @ts-ignore
        node.gathererId = creep.id;
      }

      // @ts-ignore
      if (creep.memory.resourceSubRole === 'HAULER' && creep.memory.jobMisc.resourceId === node.resourceId) {
        // @ts-ignore
        node.haulerId = creep.id;
      }
    }
  }

  private updateNodes() {
    const room = Game.rooms[this.rm.getRoomName()];

    if (this.nodeReference) {
      for (const node of this.nodeReference) {
        // @ts-ignore
        node.gathererId = null;
        // @ts-ignore
        node.haulerId = null;
      }
    }
  }

  private handleCreateSpawnRequest(energyNodes: any, queuedCreeps: SpawnRequest[], haulers: Creep[], gatherers: Creep[]) {
    // we need to spawn something...

    let haulersQueued = 0;
    let gathersQueued = 0;

    for (const queuedCreep of queuedCreeps) {
      if (queuedCreep.memoryProperties.resourceSubRole === 'GATHERER') {
        gathersQueued++;
      } else {
        haulersQueued++;
      }
    }

    const haulersToSpawn = 1 + energyNodes.length - (haulersQueued + haulers.length);
    const gatheresToSpawn = energyNodes.length - (gathersQueued + gatherers.length);

    const haulerBodyParts = this.getOptimalBodyHauler(1300);

    for (let i = 0; i < haulersToSpawn; i++) {
      // @ts-ignore
      this.gr.spawnManager.createSpawnRequest({
        bodyParts: haulerBodyParts,
        priority: 1,
        role: this.roleName,
        roomName: this.rm.getRoomName(),
        energyRequirements: this.gr.utilities.calculateBodyEnergyRequirements(haulerBodyParts),
        memoryProperties: { resourceSubRole: 'HAULER' }
      });
    }

    const gathererBodyParts = this.getOptimalBodyGatherer(this.rm.activeRoom.energyAvailable);

    for (let i = 0; i < gatheresToSpawn; i++) {
      // @ts-ignore
      this.gr.spawnManager.createSpawnRequest({
        bodyParts: gathererBodyParts,
        priority: 1,
        role: this.roleName,
        roomName: this.rm.getRoomName(),
        energyRequirements: this.gr.utilities.calculateBodyEnergyRequirements(gathererBodyParts),
        memoryProperties: { resourceSubRole: 'GATHERER' }
      });
    }
  }

  private getEnergyNodes() {
    // @ts-ignore
    const roomInfo = this.gr.memoryManager.staticInfoTracker.rooms[this.rm.getRoomName()];

    if (roomInfo) {
      const energyNodes = [];
      for (const pointOfInterest of roomInfo.pointsOfInterest) {
        if (pointOfInterest.type === 'Energy Node') {
          energyNodes.push(pointOfInterest);
        }
      }
      return energyNodes;
    }

    return null;
  }

  private getOptimalBodyGatherer(energy: number): BodyPartConstant[] {
    let bodyParts: BodyPartConstant[] = [];

    if (energy > 300) {
      const carryCount = 1;
      const workCount = Math.floor(energy / 150);
      const moveCount = 2 + Math.floor(energy / 250);

      this.addBodyParts(bodyParts, carryCount, CARRY);
      this.addBodyParts(bodyParts, workCount > 5 ? 5 : workCount, WORK);
      this.addBodyParts(bodyParts, moveCount, MOVE);
    } else {
      bodyParts = [WORK, WORK, MOVE, CARRY];
    }

    return bodyParts;
  }

  private getOptimalBodyHauler(energy: number): BodyPartConstant[] {
    let bodyParts: BodyPartConstant[] = [];

    if (energy > 300) {
      const carryCount = 0 + Math.floor(energy / 80);
      const workCount = 0 + Math.floor(energy / 1400);
      const moveCount = 1 + Math.floor(energy / 165);

      console.log('Carry count... ' + carryCount);

      this.addBodyParts(bodyParts, carryCount, CARRY);
      this.addBodyParts(bodyParts, workCount, WORK);
      this.addBodyParts(bodyParts, moveCount, MOVE);
    } else {
      bodyParts = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
    }

    return bodyParts;
  }

  private addBodyParts(bodyParts: BodyPartConstant[], count: number, type: BodyPartConstant) {
    for (let i = 0; i < count; i++) {
      bodyParts.push(type);
    }
  }

  private initMemory() {
    // @ts-ignore
    const room: Room = Game.rooms[this.rm.getRoomName()];

    // init room if it's not an object
    if (!Memory['RESOURCE_TRACKER']) {
      Memory['RESOURCE_TRACKER'] = {};
    }

    if (!Memory['RESOURCE_TRACKER'][room.name]) {
      const energyNodes = this.getEnergyNodes();
      const energyNodesForMemory = [];

      if (energyNodes != null) {
        for (const node of energyNodes) {
          const roomPosition = new RoomPosition(node.pos.x, node.pos.y, room.name);
          const energyResource: Source = room.lookForAt(LOOK_SOURCES, roomPosition)[0];

          if (energyResource) {
            energyNodesForMemory.push({
              pos: {
                x: node.pos.x,
                y: node.pos.y
              },
              harvesterPosition: {
                x: node.harvesterPosition.x,
                y: node.harvesterPosition.y
              },
              resourceId: energyResource.id,
              gathererId: null,
              haulerId: null
            });
          }
        }

        // @ts-ignore
        Memory['RESOURCE_TRACKER'][room.name] = energyNodesForMemory;
      }
    }

    this.nodeReference = Memory['RESOURCE_TRACKER'][room.name];
  }
}
