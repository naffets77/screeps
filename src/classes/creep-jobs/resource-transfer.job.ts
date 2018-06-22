import { Job } from './_base.jobs';

export class ResourceTransferJob implements Job {
  public static jobName: string = 'ResourceTransfer';

  public static process(
    creep: Creep,
    resourceType: ResourceConstant,
    sourceStructure: Structure,
    targetStructure: Structure,
    repeat: boolean
  ) {
    if ((creep.memory as any).jobStatus === 'Completed') {
      return true;
    }

    // @ts-ignore
    if (creep.memory.jobStatus === 'Init') {
      // @ts-ignore
      creep.memory.jobStatus = 'Getting Resource';
      creep.say('Get Resource');
    }

    // Given something to repair the creep will move to it and repair it if it has energy
    // @ts-ignore
    if (creep.memory.jobStatus === 'Getting Resource') {
      if (creep.carry[resourceType] !== 0) {
        // creep.carryCapacity) {
        // @ts-ignore
        creep.memory.jobStatus = 'Delivering Resource';
        creep.say('Deliver Resource');
      } else if (creep.withdraw(sourceStructure, resourceType) === ERR_NOT_IN_RANGE) {
        creep.moveTo(sourceStructure);
      }
    }

    // @ts-ignore
    if (creep.memory.jobStatus === 'Delivering Resource') {
      if (
        creep.carry[resourceType] === 0 ||
        (targetStructure.structureType === STRUCTURE_CONTAINER &&
          _.sum((targetStructure as StructureContainer).store) === (targetStructure as StructureContainer).storeCapacity) ||
        (targetStructure.structureType === STRUCTURE_EXTENSION &&
          (targetStructure as StructureExtension).energy === (targetStructure as StructureExtension).energyCapacity) ||
        (targetStructure.structureType === STRUCTURE_SPAWN &&
          (targetStructure as StructureSpawn).energy === (targetStructure as StructureSpawn).energyCapacity)
      ) {
        if (repeat) {
          // @ts-ignore
          creep.memory.jobStatus = 'Init';
          creep.say('Restart');
        } else {
          // @ts-ignore
          creep.memory.jobStatus = 'Completed';
          creep.say('Haul Complete');
        }
      } else if (creep.transfer(targetStructure, resourceType) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetStructure);
      }
    }

    return false;
  }
}
