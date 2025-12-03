
import Fastify from 'fastify';
import fastifyCors from 'fastify-cors';
import fastifyJwt from 'fastify-jwt';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

fastify.register(fastifyCors, {
  origin: (origin, cb) => {
    cb(null, true);
  },
  credentials: true
});

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_secret';
fastify.register(fastifyJwt, { secret: JWT_SECRET });

fastify.decorate("auth", async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

fastify.post('/auth/register', async (request, reply) => {
  const { email, password } = request.body ?? {};
  if (!email || !password) {
    return reply.code(400).send({ error: 'Email and password required' });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reply.code(400).send({ error: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash }
  });
  return { id: user.id, email: user.email };
});

fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body ?? {};
  if (!email || !password) {
    return reply.code(400).send({ error: 'Email and password required' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }
  const token = fastify.jwt.sign({ sub: user.id, email: user.email });
  return { token };
});

fastify.get('/me/workflows', { preValidation: [fastify.auth] }, async (request, reply) => {
  const userId = request.user.sub;
  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });
  return workflows;
});

fastify.post('/me/workflows', { preValidation: [fastify.auth] }, async (request, reply) => {
  const userId = request.user.sub;
  const { title } = request.body ?? {};
  if (!title) {
    return reply.code(400).send({ error: 'Title required' });
  }
  const wf = await prisma.workflow.create({
    data: {
      userId,
      title
    }
  });
  return wf;
});

fastify.get('/me/workflows/:id', { preValidation: [fastify.auth] }, async (request, reply) => {
  const userId = request.user.sub;
  const id = Number(request.params.id);
  const wf = await prisma.workflow.findFirst({
    where: { id, userId }
  });
  if (!wf) {
    return reply.code(404).send({ error: 'Not found' });
  }
  return wf;
});

fastify.put('/me/workflows/:id', { preValidation: [fastify.auth] }, async (request, reply) => {
  const userId = request.user.sub;
  const id = Number(request.params.id);
  const { title, state } = request.body ?? {};
  const wf = await prisma.workflow.findFirst({
    where: { id, userId }
  });
  if (!wf) {
    return reply.code(404).send({ error: 'Not found' });
  }
  const updated = await prisma.workflow.update({
    where: { id },
    data: {
      title: title ?? wf.title,
      state: state ?? wf.state
    }
  });
  return updated;
});

const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen(port, '0.0.0.0');
    fastify.log.info(`Server listening on ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
