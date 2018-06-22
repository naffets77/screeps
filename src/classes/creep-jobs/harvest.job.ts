import { Job } from './_base.jobs';

export class HarvestJob implements Job {
  public static jobName: string = 'Harvest';

  public static process(creep: Creep, targetPosition: RoomPosition, energySource: Source): boolean {
    // creep will sit in front of node and harvest constantly on a container,
    // overlow will be caught by the container. Other creeps will gather from the container.

    if (creep.harvest(energySource) === ERR_NOT_IN_RANGE || creep.pos.x !== targetPosition.x || creep.pos.y !== targetPosition.y) {
      // console.log('Moving to taget position : ' + JSON.stringify(targetPosition));
      creep.moveTo(targetPosition);
    }

    return false;
  }
}
