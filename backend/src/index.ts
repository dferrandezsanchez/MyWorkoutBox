import 'dotenv/config';
import { createContainer } from './main/container';
import { createHttpApp } from './interfaces/http/app';

const PORT = process.env.PORT || 3000;
const app = createHttpApp(createContainer());

// Start server only when this file is executed directly.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
