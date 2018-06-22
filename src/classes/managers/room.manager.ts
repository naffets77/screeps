import { GameReferences } from 'models/game-references';
import { RoomControllerDefinition } from 'models/lookup-definitions/room-controller.definition';
import { RoomControllerLookup } from 'lookups/room-controller.lookup';
import { ResourceManager } from './creep-managers/resource.manager';
import { BuildingManager } from './creep-managers/building.manager';
import { ControllerManager } from './creep-managers/controller.manager';
import { ScoutManager } from './creep-managers/scout.manager';

export class RoomManager implements Runnable {
  private gr: GameReferences;
  private controllerInfo: RoomControllerDefinition;

  // @ts-ignore
  public activeRoom: Room;

  private roomLookup: RoomControllerLookup;

  constructor(gameReference: GameReferences) {
    this.gr = gameReference;

    this.roomLookup = new RoomControllerLookup();
    this.controllerInfo = this.roomLookup.lookup(this.gr.memoryManager.infoTracker.controllerLevel);
  }

  public setRoom(room: Room) {
    this.activeRoom = room;
  }

  public getRoomName() {
    return this.activeRoom.name;
  }

  public getRoomEnergyPercentage(): number {
    return this.activeRoom.energyAvailable / this.activeRoom.energyCapacityAvailable;
  }

  public run() {
    if (this.activeRoom == null) {
      return;
    }

    if (this.gr.memoryManager.reportFlag) {
      console.log(' Spawn Report');
      this.gr.spawnManager.report(this.activeRoom.name);
      // this.gr.memoryManager.infoTracker.room.extensionCount = this.getExtensionCount();
      // console.log(`Updating Counts Extractor : ${this.gr.memoryManager.infoTracker.room.extensionCount}`);
      // this.controllerInfo = this.roomLookup.lookup(this.gr.memoryManager.infoTracker.controllerLevel);
    }

    // Does the room have a controller, and does it have an owner
    if (
      this.activeRoom &&
      this.activeRoom.controller &&
      this.activeRoom.controller.owner &&
      this.activeRoom.controller.owner.username === 'steffan'
    ) {
      // Resource Manager: Resources are being used
      const resourceManager = new ResourceManager(this.gr, this);
      resourceManager.run();

      // Building manager: Buildings are built and repaired
      const buildingManager = new BuildingManager(this.gr, this);
      buildingManager.run();

      const controllerManager = new ControllerManager(this.gr, this);
      controllerManager.run();

      const scoutManager = new ScoutManager(this.gr, this);
      scoutManager.run();

      // need to clean up the spawn manager and the rooms
      this.gr.spawnManager.setRoom(this.activeRoom);
      this.gr.spawnManager.processQueue(this.activeRoom.name);
    }

    return true;
  }
}
