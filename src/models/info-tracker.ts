import { RoomInfo } from './info-tracker/room-info.interface';

export interface InfoTracker {
  creepTracker: any;
  // @ts-ignore
  scanCountDown: number;
  controllerLevel: number;
  room: RoomInfo;
}
