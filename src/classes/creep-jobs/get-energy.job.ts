import { Job } from './_base.jobs';

export class GetEnergyJob implements Job {
  public static jobName: string = 'GetEnergy';

  public static process(creep: Creep, energyContainer: Structure): boolean {
    // Creep will move to energy container and retrieve energy till full
    if (creep.carry.energy === creep.carryCapacity) {
      return true;
    }

    if (creep.withdraw(energyContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(energyContainer);
    }

    return false;
  }
}
