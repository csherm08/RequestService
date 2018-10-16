/* app/server.ts */

// Import everything from express and assign it to the express variable
import * as express from 'express';

// Import WelcomeController from controllers entry point
import { OrderController } from './controllers';

// Create a new express application instance
const app: express.Application = express();
// The port the express app will listen on
const port: number = 4000;

// Mount the OrderController at the /order route
app.use('/orders', OrderController);

// Serve the application at the given port
app.listen(port, () => {
  // Success callback
  console.log(`Listening at http://localhost:${port}/`);
});