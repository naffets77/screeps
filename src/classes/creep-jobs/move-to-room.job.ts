import { Job } from './_base.jobs';

export class MoveToRoomJob implements Job {
  public static jobName: string = 'MoveToPosition';

  public static process(creep: Creep, originalRoomName: string, targetRoomName: string) {
    if ((creep.memory as any).jobStatus === 'Init') {
      // @ts-ignore
      creep.memory.jobStatus = 'Moving To Exit';
    }

    if ((creep.memory as any).jobStatus === 'Moving To Exit') {
      console.log('Scout current room : ' + creep.room.name + ' trying to get to room: ' + targetRoomName);

      if (creep.room.name === targetRoomName) {
        (creep.memory as any).jobStatus = 'Move Into Room';
      } else {
        const route = Game.map.findRoute(creep.room.name, targetRoomName);

        console.log('Scout route result: ' + JSON.stringify(route));
        if (route !== ERR_NO_PATH) {
          (creep.memory as any).jobStatus = 'Moving To Exit';
          const exit = creep.pos.findClosestByPath(route[0].exit);
          creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    }

    if ((creep.memory as any).jobStatus === 'Move Into Room') {
      creep.moveTo(25, 25, { visualizePathStyle: { stroke: '#ffffff' } });
      return true;
    }

    // step 2 -> get Direction of exit

    // step 3 -> move in that direction?

    // creep.moveTo(targetPosition);

    return false;
  }
}
