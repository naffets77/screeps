import { Job } from './_base.jobs';

export class RenewJob implements Job {
  public static jobName: string = 'Renew';

  public static process(creep: Creep, targetSpawn: StructureSpawn) {
    // creep will sit in front of node and harvest constantly on a container,
    // overlow will be caught by the container. Other creeps will gather from the container.

    if (creep.ticksToLive && creep.ticksToLive >= 1400) {
      return true;
    }

    (creep.memory as any).renew = true;
    if (targetSpawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
      creep.moveTo(targetSpawn);
    }

    return false;
  }
}
