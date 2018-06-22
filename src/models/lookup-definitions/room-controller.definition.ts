export interface RoomControllerDefinition {
  Containers: number;
  Spawn?: number;
  Extensions?: number;
  Walls?: number;
  Towers?: number;
  Storage?: number;
  Link?: number;

  Ramparts?: boolean;
  Roads: boolean;
}
