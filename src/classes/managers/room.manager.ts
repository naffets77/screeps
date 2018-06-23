import { GameReferences } from 'models/game-references';
import { RoomControllerDefinition } from 'models/lookup-definitions/room-controller.definition';
import { RoomControllerLookup } from 'lookups/room-controller.lookup';
import { ResourceManager } from './creep-managers/resource.manager';
import { BuildingManager } from './creep-managers/building.manager';
import { ControllerManager } from './creep-managers/controller.manager';
import { ScoutManager } from './creep-managers/scout.manager';
import { ScreepConfig } from 'config';
import { OvermindManager } from './world-managers/overmind-manager/overmind.manager';

export class RoomManager implements Runnable {
  private gr: GameReferences;
  private overmind: OvermindManager;
  private controllerInfo: RoomControllerDefinition;

  // @ts-ignore
  public activeRoom: Room;
  // @ts-ignore
  public scoutManager: ScoutManager;
  // @ts-ignore
  public controllerManager: ControllerManager;
  // @ts-ignore
  public resourceManager: ResourceManager;
  // @ts-ignore
  public buildingManager: BuildingManager;

  private roomLookup: RoomControllerLookup;

  constructor(gameReference: GameReferences, overmindManager: OvermindManager) {
    this.gr = gameReference;
    this.overmind = overmindManager;

    this.roomLookup = new RoomControllerLookup();
    this.controllerInfo = this.roomLookup.lookup(this.gr.memoryManager.infoTracker.controllerLevel);
  }

  public setRoom(room: Room) {
    if (room == null || room === undefined) {
      throw new Error('Trying to set room that is null');
    }

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
    if (this.shouldRunManagers()) {
      this.resourceManager = new ResourceManager(this.gr, this);
      this.buildingManager = new BuildingManager(this.gr, this);
      this.controllerManager = new ControllerManager(this.gr, this);
      this.scoutManager = new ScoutManager(this.gr, this);

      this.overmind.process(this);
      // this.resourceManager.run();
      // this.buildingManager.run();
      // this.controllerManager.run();
      // this.scoutManager.run();

      // need to clean up the spawn manager and the rooms
      this.gr.spawnManager.setRoom(this.activeRoom);
      this.gr.spawnManager.processQueue(this.activeRoom.name);
    }

    return true;
  }

  private shouldRunManagers() {
    return (
      this.activeRoom &&
      this.activeRoom.controller &&
      this.activeRoom.controller.owner &&
      this.activeRoom.controller.owner.username === ScreepConfig.username
    );
  }
}
