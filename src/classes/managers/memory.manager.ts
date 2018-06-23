import { InfoTracker } from 'models/info-tracker';

export class MemoryManager {
  public infoTracker: InfoTracker;
  public staticInfoTracker: any; // define later
  public reportFlag: boolean;

  private ticksTillScan = 10;
  constructor() {
    this.init();
    this.infoTracker = Memory['INFO_TRACKER'];
    this.reportFlag = false;
    this.staticInfoTracker = {
      rooms: {}
    };
  }

  public run() {
    // console.log('Updating Brain In ... ' + this.infoTracker.scanCountDown);

    // Comment back in for reporting
    // this.infoTracker.scanCountDown--;
    // if (this.infoTracker.scanCountDown <= 0) {
    //   console.log('*** UPDATES ***');
    //   this.reportFlag = true;
    //   this.infoTracker.scanCountDown = this.ticksTillScan;
    //   this.infoTracker.controllerLevel = this.getControllerLevel();
    // } else {
    //   this.reportFlag = false;
    // }

    // update memory...
    Memory['INFO_TRACKER'].scanCountDown = this.infoTracker.scanCountDown;
  }

  public updateMemory() {
    Memory['INFO_TRACKER'] = this.infoTracker;
  }

  public pushRoomInfo(roomInfo: any) {
    this.staticInfoTracker.rooms[roomInfo.name] = roomInfo;
  }

  private init() {
    // if info tracker is not set then we need to initialize it

    if (!Memory['INFO_TRACKER']) {
      console.log('Initializing info tracker');

      const infoTracker: InfoTracker = {
        scanCountDown: 1,
        controllerLevel: this.getControllerLevel(),
        room: {
          extensionCount: 0,
          name: 'sim' // should be updated to name of room you tart with. Could be dynamically updated somehow???
        },
        creepTracker: {
          // magic strings ??
          HARVESTER: {
            count: 0
          },
          WORKER: {
            count: 0
          }
        }
      };

      Memory['INFO_TRACKER'] = infoTracker;

      // we'll want to build it from the world state if it doesn't exists... which will be expensive, so we'll
      // just do it everynow and then to make sure we're in sync!
    }
  }

  private getControllerLevel(): number {
    let result = 0;
    if (Game.creeps[Object.keys(Game.creeps)[0]]) {
      const roomController = Game.creeps[Object.keys(Game.creeps)[0]].room.controller;
      if (roomController) {
        result = roomController.level;
      }
    }
    return result;
  }
}
