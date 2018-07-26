import { MemoryManager } from 'classes/managers/memory.manager';
import { ResourceManager } from 'classes/managers/creep-managers/resource.manager';
import { SpawnManager } from 'classes/managers/spawn.manager';
import { ErrorMapper } from 'utils/ErrorMapper';
import { GameReferences } from 'models/game-references';
import { WorkManager } from 'classes/managers/work.manager';
import { WorkerRole } from 'classes/creep-roles/worker.role';
import { ScreepUtils } from 'utils/ScreepUtils';
import { RoomManager } from 'classes/managers/room.manager';
import { WorldManager } from 'classes/managers/world.manager';

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`!! Current game tick is ${Game.time}`);

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  /*
    We're going to want to reuse all the managers per room. I assume we'll be looping across rooms for priority actions .. then less priority per as much cpu power as we have to save cpu power
    we'll want to re-use the managers, so we'll have some object to initialize them with all the data they'll need for the information. I.e. the room name, should be passed in as part of that
    object...
  */
  const screepUtils = new ScreepUtils();
  const memoryManager = new MemoryManager();
  const spawnManager = new SpawnManager('SPAWN_1', screepUtils);

  const gameReferences = new GameReferences();

  // const roomManager = new RoomManager(gameReferences);
  // const resourceManager = new ResourceManager(gameReferences);
  const workManager = new WorkManager(gameReferences);
  const worldManager = new WorldManager();

  const workers: Runnable[] = [worldManager, workManager]; // resourceManager, roomManager

  // doing this manually to gurantee it always happens first...
  // memoryManager.run();

  for (const worker in workers) {
    workers[worker].run();

    // if (memoryManager.reportFlag) {
    //   memoryManager.updateMemory();
    // }
  }

  for (const creepIndex in Game.creeps) {
    const creep = Game.creeps[creepIndex];

    // @ts-ignore
    const role: string = creep.memory.role;
    switch (role) {
      case 'HARVESTER':
      case 'BUILDER':
      case 'CONTROLLER':
      case 'SCOUT':
        workManager.processJob(creep);
        break;
      case 'WORKER':
        const workerRoleProcess = new WorkerRole();
        workerRoleProcess.process(creep);
        break;
      case 'BOOTSTRAPPER': // skip
      break;
      default:
        console.log('CREEP ROLE NOT ASSIGNED TO ANYTHING!!! : ' + role);
    }
  }

  const roomName = 'W7N7';

  const hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
  if (hostiles.length > 0) {
    const username = hostiles[0].owner.username;
    Game.notify(`User ${username} spotted in room ${roomName}`);
    // @ts-ignore
    const towers = Game.rooms[roomName].find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
    // @ts-ignore
    towers.forEach(tower => tower.attack(hostiles[0]));
  } else {
    // console.log("No Hostiles Found");
  }

  // console.log('hello world 1');
});
