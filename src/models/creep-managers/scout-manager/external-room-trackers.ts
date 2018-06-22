import { ExternalRoomTracker } from './external-room-tracker';

export interface ExternalRoomTrackers {
  [key: string]: ExternalRoomTracker;
  // lastSeenTic: number;
  // roomObjects: ExternalRoomObject[];
}
