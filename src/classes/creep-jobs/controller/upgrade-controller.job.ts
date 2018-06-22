import { Job } from '../_base.jobs';

export class UpgradeControllerJob implements Job {
  public static jobName: string = 'UpgradeController';

  public static process(creep: Creep, roomController: StructureController): boolean {
    // reset, should probably have some method that does this
    if (creep.carry.energy === 0) {
      return true;
    }

    // Given something to repair the creep will move to it and repair it if it has energy

    if (creep.upgradeController(roomController) === ERR_NOT_IN_RANGE) {
      creep.moveTo(roomController);
    }

    return false;
  }
}
