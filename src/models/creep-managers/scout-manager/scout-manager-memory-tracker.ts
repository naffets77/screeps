import { InfoTrackerBase } from '../../info-tracker/info-tracker.base';
import { ExternalRoomTrackers } from './external-room-trackers';

export interface ScoutManagerMemoryTracker extends InfoTrackerBase {
  rooms: ExternalRoomTrackers;
}
