import { ExternalRoomObject } from './external-room-object';

export interface ExternalRoom {
  lastSeenTic: number;
  roomObjects?: ExternalRoomObject[];
}
