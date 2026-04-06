import 'dotenv/config';
import payload from 'payload';
import config from './payload.config';

async function main() {
  await payload.init({
    config,
    onInit: async (payload) => {
      payload.logger.info('Payload initialized');
    },
  });

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  payload.logger.info(`Server started on port ${port}`);
}

main();