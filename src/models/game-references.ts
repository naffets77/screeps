import { MemoryManager } from 'classes/managers/memory.manager';
import { SpawnManager } from 'classes/managers/spawn.manager';
import { ScreepUtils } from 'utils/ScreepUtils';
import { ExternalRoomManager } from 'classes/managers/world-managers/external-room.manager';

export class GameReferences {
  public externalRoomManager: ExternalRoomManager;
  public spawnManager: SpawnManager;
  public memoryManager: MemoryManager;
  public utilities: ScreepUtils;

  constructor() {
    this.memoryManager = new MemoryManager();
    this.utilities = new ScreepUtils();
    this.externalRoomManager = new ExternalRoomManager();
    this.spawnManager = new SpawnManager('SPAWN_1', this.utilities);
  }
}
