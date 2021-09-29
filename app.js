import { app, errorHandler } from 'mu';
import { getNotStartedPublicationTasks, TASK_ONGOING_STATUS } from './lib/publication-task';

// TODO any env variables needed?
const requiredEnvironmentVariables = [

];

let error = false;
requiredEnvironmentVariables.forEach((key) => {
  if (!process.env[key]) {
    console.log(`[ERROR]:Environment variable ${key} must be configured`);
    error = true;
  }
});
if (error) process.exit(1);

app.post('/delta', async function (req, res, next) {
  console.log("Processing deltas for API...");

  const publicationTasks = await getNotStartedPublicationTasks();

  if (publicationTasks) {
    console.log(`Found ${publicationTasks.length} publication tasks to be processed.`);
    for (const publicationTask of publicationTasks) {
      await publicationTask.persistStatus(TASK_ONGOING_STATUS);
    };
    res.sendStatus(202);
    for (const publicationTask of publicationTasks) {
      await publicationTask.process();
    };
  } else {
    console.log(`No publication tasks found to be processed.`);
    return res.status(200).end();
  }
});

app.use(errorHandler);
