import {DateTime} from "luxon";

export const floor = (dt : DateTime<true>) =>  dt.startOf('minute');
export const ceil = (dt : DateTime<true>) =>  dt.second === 0 && dt.millisecond === 0 ? dt : dt.plus({ minutes: 1 }).startOf('minute');

