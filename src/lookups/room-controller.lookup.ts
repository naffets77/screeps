import { RoomControllerDefinition } from 'models/lookup-definitions/room-controller.definition';

export class RoomControllerLookup {
  private data: RoomControllerDefinition[] = [
    {
      Containers: 5,
      Roads: true
    },
    {
      Containers: 5,
      Roads: true,
      Spawn: 1
    },
    {
      Containers: 5,
      Extensions: 5,
      Ramparts: true,
      Roads: true,
      Spawn: 1
    }
  ];

  public lookup(controllerLevel: number): RoomControllerDefinition {
    return this.data[controllerLevel];
  }
}
