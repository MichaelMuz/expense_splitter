import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth.routes';
import groupsRoutes from './routes/groups.routes';
import membersRoutes from './routes/members.routes';
import expensesRouter from './routes/expenses.routes';
import settlementsRouter from './routes/settlements.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Expense Splitter API is running' });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/groups', membersRoutes);
app.use('/api/groups', expensesRouter);
app.use('/api/groups', settlementsRouter);

// Error handler - must be registered LAST
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
