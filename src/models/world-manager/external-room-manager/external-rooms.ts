import { ExternalRoomObject } from './external-room-object';
import { ExternalRoom } from './external-room';

export interface ExternalRooms {
  [key: string]: ExternalRoom;
  // lastSeenTic: number;
  // roomObjects: ExternalRoomObject[];
}
