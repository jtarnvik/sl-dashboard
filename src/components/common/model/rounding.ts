import {DateTime} from "luxon";

export const floor = (dt : DateTime) =>  dt.startOf('minute');
export const ceil = (dt : DateTime) =>  dt.second === 0 && dt.millisecond === 0 ? dt : dt.plus({ minutes: 1 }).startOf('minute');

