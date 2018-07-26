import { RoomManager } from '../../room.manager';
import { ItemOfWork } from 'models/world-manager/overmind-manager/item-of-work';

export class OvermindManager {
  // create a list of things for it to remember

  constructor() {}

  public process(roomManager: RoomManager): void {
    // need a list of things to do
    // calculate heuristic and generate list of things to do

    // console.log('overmind processing room');
  }

  private createQueue() {
    const workItems: ItemOfWork[] = [];
  }
}
