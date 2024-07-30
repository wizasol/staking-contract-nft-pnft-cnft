import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(minMax);
dayjs.tz.setDefault('Europe/Rome');

const daytz = (date: any, format: any, strict: any) =>
  dayjs.tz(date, format, strict);

export { daytz, dayjs };
