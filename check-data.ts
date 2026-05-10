import { prisma } from './lib/prisma.js';

async function check() {
  const users = await prisma.user.count();
  const deposits = await prisma.deposit.count();
  const bets = await prisma.bet.count();
  const ledgers = await prisma.ledger.count();

  console.log('=== 数据库内容检查 ===');
  console.log('用户数量:', users);
  console.log('存款数量:', deposits);
  console.log('下注数量:', bets);
  console.log('账本数量:', ledgers);

  if (users > 0) {
    console.log('\n=== 示例用户 ===');
    const sampleUser = await prisma.user.findFirst();
    console.log(JSON.stringify(sampleUser, null, 2));

    console.log('\n=== 示例下注 ===');
    const sampleBet = await prisma.bet.findFirst();
    if (sampleBet) {
      console.log(JSON.stringify(sampleBet, null, 2));
    }

    console.log('\n=== 示例账本记录 ===');
    const sampleLedgers = await prisma.ledger.findMany({ take: 3 });
    console.log(JSON.stringify(sampleLedgers, null, 2));
  }

  await prisma.$disconnect();
}

check();