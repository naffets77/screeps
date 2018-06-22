export interface BodyOptions {
  baseBody: BodyPartConstant[];

  carry?: number;
  work?: number;
  move?: number;

  carryMinimum?: number;
  workMinimum?: number;
  moveMinimum?: number;
}
