import { Job } from './_base.jobs';

export class GetEnergyJob implements Job {
  public static jobName: string = 'GetEnergy';

  public static process(creep: Creep, target: any, targetType: string = 'structure'): boolean {
    // Creep will move to energy container and retrieve energy till full
    if (creep.carry.energy === creep.carryCapacity) {
      return true;
    }

    if (targetType === 'structure') {
      if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    } else if (targetType === 'source') {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    }
    return false;
  }
}
