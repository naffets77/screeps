import { ScreepUtils } from 'utils/ScreepUtils';
import { SpawnRequest } from 'models/spawn-request';
import { MemoryManager } from './memory.manager';

/* Build Costs
  MOVE: 50
  WORK: 100
  CARRY: 50
  ATTACK: 80
  RANGED_ATTACK: 150
  HEAL: 250
  CLAIM: 600
  TOUGH: 10

  http://docs.screeps.com/api/#Creep
*/

export class SpawnManager implements Runnable {
  // @ts-ignore
  private activeRoom: Room;
  private room: string;
  private name: string = 'Spawn Manager';
  private utilities: ScreepUtils;

  private spawnRequests: any; // hash on name for array of type SpawnRequest

  private bodyInfo: any = {
    Move: {
      energy: 50,
      priority: 1,
      require: 1
    }
  };

  constructor(room: string, utilities: ScreepUtils) {
    this.room = room;
    this.utilities = utilities;

    this.spawnRequests = this.getSpawnRequestFromMemory();
  }

  public setRoom(room: Room) {
    this.activeRoom = room;
  }

  public run() {
    if (this.spawnRequests.length > 0) {
      console.log('Active Spawn Requests: ' + this.spawnRequests.length);
    }
    // clean up
    this.saveSpawnRequestsToMemory();
  }

  public processQueue(roomName: string) {
    if (this.spawnRequests[roomName]) {
      const queue: SpawnRequest[] = this.spawnRequests[roomName];
      const availableEnergy = Game.rooms[roomName].energyAvailable;

      // we want to spawn the highest priority thing that we have energy for

      // okay so for now we have 1 spawner, and i'm just going to find the first thing I can build and remove it from the array

      let selectedSpawnRequestIndex = null;
      for (let i = 0; i < queue.length; i++) {
        if (queue[i].energyRequirements <= availableEnergy) {
          selectedSpawnRequestIndex = i;
        }
      }

      if (selectedSpawnRequestIndex != null) {
        const selectedSpawnRequest: SpawnRequest = queue.splice(selectedSpawnRequestIndex, 1)[0];

        const memoryObj = {
          _meta: {
            // energy requirements
            e_req: selectedSpawnRequest.energyRequirements,
            // created tic
            c_tic: Game.time,
            // role history
            r_his: [selectedSpawnRequest.role]
          },
          role: selectedSpawnRequest.role,
          room: roomName,
          job: 'Idle',
          jobTargetIds: [],
          jobStatus: 'Init',
          jobMisc: {}
        };

        for (const attrName in selectedSpawnRequest.memoryProperties) {
          // @ts-ignore
          memoryObj[attrName] = selectedSpawnRequest.memoryProperties[attrName];
        }

        // need to get spawners by room.. find one that's not busy.. etc..
        if (!Game.spawns['SPAWN_1'].spawning) {
          // need to go through array of available spawners (should of done this first...)
          const resultSpawn = Game.spawns['SPAWN_1'].spawnCreep(
            selectedSpawnRequest.bodyParts,
            selectedSpawnRequest.role + '_' + Math.floor(Math.random() * 10000) + 1,
            {
              memory: memoryObj
            }
          );
          if (resultSpawn !== OK) {
            console.log(`Spawn failed for  ${JSON.stringify(selectedSpawnRequest)} : ${resultSpawn}`);
            queue.push(selectedSpawnRequest);
          }
        }
      }
    }
  }

  public report(roomName: string) {
    if (this.spawnRequests[roomName]) {
      console.log(`  Room ${roomName} - Queued Count : ${this.spawnRequests[roomName].length}`);
    } else {
      console.log(`  Room ${roomName} - Queued Count : 0`);
    }
  }

  public getQueuedSpawnRequests(role: string, roomName: string): SpawnRequest[] {
    const spawnedRequests: SpawnRequest[] = [];

    if (this.spawnRequests[roomName]) {
      const requests: SpawnRequest[] = this.spawnRequests[roomName];
      for (const request of requests) {
        if (request.role === role) {
          spawnedRequests.push(request);
        }
      }
    }

    return spawnedRequests;
  }

  private getSpawnRequestFromMemory(): SpawnRequest[] {
    let spawnRequests = Memory['SPAWN_REQUESTS'];

    if (!spawnRequests) {
      spawnRequests = {};
    }

    return spawnRequests;
  }

  private saveSpawnRequestsToMemory() {
    Memory['SPAWN_REQUESTS'] = this.spawnRequests;
  }

  public createSpawnRequest(spawnRequest: SpawnRequest) {
    if (this.spawnRequests[spawnRequest.roomName]) {
      this.spawnRequests[spawnRequest.roomName].push(spawnRequest);
    } else {
      this.spawnRequests[spawnRequest.roomName] = [spawnRequest];
    }
  }

  public spawn(role: string, bodyParts: BodyPartConstant[], count: number): boolean {
    let result = true;
    console.log(`Spawning ${role}_${count}`);
    const resultSpawn = Game.spawns[this.room].spawnCreep(this.getBodyParts(), role + '_' + Math.floor(Math.random() * 10000) + 1, {
      memory: { role }
    }); // [WORK, CARRY, MOVE]

    if (resultSpawn !== OK) {
      result = false;
      console.log(`Spawning ${role} failed: ${resultSpawn}`);
    }
    return result;
  }

  // hardcoded for now ...
  public getBodyParts(): BodyPartConstant[] {
    let bodyParts: BodyPartConstant[] = [WORK, WORK, CARRY, MOVE];
    switch (this.utilities.energyAvailabile()) {
      case 300:
        bodyParts = [WORK, WORK, CARRY, MOVE];
        break;
      case 350:
      case 400:
        bodyParts = [WORK, WORK, CARRY, MOVE, MOVE];
        break;
      case 450:
      case 500:
        bodyParts = [WORK, WORK, WORK, CARRY, MOVE, MOVE];
        break;
      case 550:
        bodyParts = [WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE];
        break;
      case 600:
        bodyParts = [WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE];
        break;
      case 650:
        bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        break;
      case 700:
      case 750:
        bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        break;
      case 800:
        bodyParts = [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        break;
    }

    return bodyParts;
  }

  public debug() {
    console.log(this.name);
  }
}
