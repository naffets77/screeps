import { ExternalRoomManagerMemoryTracker } from './world-manager/external-room-manager/external-room-manager-memory-tracker';
import { InfoTrackerBase } from './info-tracker/info-tracker.base';

export interface MemoryInfoTracker {
  [key: string]: InfoTrackerBase;
  EXT_ROOM_TRACKER: InfoTrackerBase;
  SCOUT_TRACKER: InfoTrackerBase;
}
