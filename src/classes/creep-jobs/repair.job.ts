import { Job } from './_base.jobs';

export class RepairJob implements Job {
  public static jobName: string = 'Repair';

  public static process(creep: Creep, structure: Structure) {
    // reset, should probably have some method that does this
    if (structure.hits === structure.hitsMax || creep.carry.energy === 0) {
      return true;
    }

    // Given something to repair the creep will move to it and repair it if it has energy

    if (creep.repair(structure) === ERR_NOT_IN_RANGE) {
      creep.moveTo(structure);
    }

    return false;
  }
}
