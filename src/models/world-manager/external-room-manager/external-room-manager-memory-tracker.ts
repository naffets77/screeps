import { PrimaryRooms } from './primary-rooms';
import { ExternalRoomObject } from './external-room-object';
import { InfoTrackerBase } from '../../info-tracker/info-tracker.base';

export interface ExternalRoomManagerMemoryTracker extends InfoTrackerBase {
  rooms: PrimaryRooms;
  externalObjects: ExternalRoomObject[];
}
