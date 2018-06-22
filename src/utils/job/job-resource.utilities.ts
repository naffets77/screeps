export class JobResourceUtilities {
  public static refillRoomCapacity(creep: Creep, room: Room, options: any) {
    // first look for storage

    // then look for containers

    // finally look for nearest source

    // find empty containers to fill with energy
    const container: Structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => {
        let result: boolean = true;
        if (
          (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
          structure.energy < structure.energyCapacity
        ) {
          result = true;
        } else {
          result = false;
        }
        return result;
      }
    }) as Structure;

    if (room.storage && container) {
      JobResourceUtilities.transferResource(creep, room.storage.id, container.id, options);
    }
    // move energy from storage to the container
  }

  private static transferResource(creep: Creep, sourceStructureId: string, targetStructureId: string, options: any) {
    (creep.memory as any).job = 'ResourceTransfer';

    (creep.memory as any).jobMisc = {
      resourceType: RESOURCE_ENERGY
    };

    (creep.memory as any).jobTargetIds = [sourceStructureId, targetStructureId];

    creep.say('Hauling!');
  }
}
