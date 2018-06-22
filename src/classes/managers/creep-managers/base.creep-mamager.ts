import { GameReferences } from 'models/game-references';
import { RoomManager } from '../room.manager';

export class BaseCreepManager {
  protected gr: GameReferences;
  protected rm: RoomManager;

  constructor(gameReference: GameReferences, roomManager: RoomManager) {
    this.gr = gameReference;
    this.rm = roomManager;
  }

  protected CPUUsageReport() {
    if (this.gr.memoryManager.reportFlag) {
      console.log(` completed : ${Game.cpu.getUsed()}`);
    }
  }
}
