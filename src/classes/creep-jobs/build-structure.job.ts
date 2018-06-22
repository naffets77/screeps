import { Job } from './_base.jobs';

export class BuildStructureJob implements Job {
  public static jobName: string = 'BuildStructure';

  public static process(creep: Creep, constructionSite: ConstructionSite): boolean {
    // reset, should probably have some method that does this
    if (creep.carry.energy === 0 || constructionSite == null) {
      return true;
    }

    // Given something to repair the creep will move to it and repair it if it has energy

    if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
      creep.moveTo(constructionSite);
    }

    return false;
  }
}
