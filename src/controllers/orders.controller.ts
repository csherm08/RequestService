import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
  res.send('{}');
});

router.get('/:orders', (req: Request, res: Response) => {
  // Extract the name from the request parameters
  let { orders } = req.params;
  console.log(req.params);
  res.send(`Hello, ${orders}`);
});

// Export the express.Router() instance to be used by server.ts
export const OrderController: Router = router;
