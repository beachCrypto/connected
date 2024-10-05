import { fetchAndProcessCasts } from '../workers/castWorker';

export const onSchedule = [
  {
    cron: '*/10 * * * *',
    name: 'fetch-casts',
  },
];

export default async function fetchCastsScheduled() {
  console.log("Running scheduled job to fetch and process casts");
  return fetchAndProcessCasts();
}