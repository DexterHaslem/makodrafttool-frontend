import {Champion, Champions} from "./models";
import * as R from 'ramda';

export function findChampByShortName(allChamps: Champions, champName: string) : Champion | null {
  const champNameMatches = c => c.name === champName;
  // fun fact: R.concat only concats first two arguments yeehaw
  let allChampCategories = R.concat(allChamps.melee, allChamps.ranged);
  allChampCategories = R.concat(allChampCategories, allChamps.support);
  const found = R.find(champNameMatches, allChampCategories);
  return found;
}

export function prettyChampName(allChamps: Champions, champName: string): string {
  const found = findChampByShortName(allChamps, champName);
  return found ? found.displayName : champName;
}
