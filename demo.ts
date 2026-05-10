import { prisma } from './lib/prisma'

async function demo() {
  console.log('=== 演示预测平台数据库操作 ===')

  // 创建用户
  const user = await prisma.user.create({
    data: { username: 'demo-user', balance: 1000 }
  })
  console.log('创建用户:', user)

  // 存款
  await prisma.deposit.create({
    data: { userId: user.id, amount: 500, idempotencyKey: 'demo-deposit' }
  })
  await prisma.user.update({
    where: { id: user.id },
    data: { balance: { increment: 500 } }
  })
  await prisma.ledger.create({
    data: { userId: user.id, type: 'DEPOSIT', amount: 500 }
  })
  console.log('存款 500，用户余额:', await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } }))

  // 下注
  const bet = await prisma.bet.create({
    data: { userId: user.id, gameId: 'demo-game', amount: 200 }
  })
  await prisma.user.update({
    where: { id: user.id },
    data: { balance: { decrement: 200 } }
  })
  await prisma.ledger.create({
    data: { userId: user.id, type: 'BET_DEBIT', amount: -200, betId: bet.id }
  })
  console.log('下注 200，用户余额:', await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } }))

  // 结算赢单
  await prisma.bet.update({
    where: { id: bet.id },
    data: { status: 'SETTLED' }
  })
  const winAmount = 400 // 2x payout
  await prisma.user.update({
    where: { id: user.id },
    data: { balance: { increment: winAmount } }
  })
  await prisma.ledger.create({
    data: { userId: user.id, type: 'BET_CREDIT', amount: winAmount, betId: bet.id }
  })
  console.log('赢单 400，用户余额:', await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } }))

  // 查看账本
  const ledgers = await prisma.ledger.findMany({
    where: { userId: user.id }
  })
  console.log('账本记录:', ledgers)

  // 对账
  const totalLedger = ledgers.reduce((sum, l) => sum + l.amount, 0)
  const userBalance = (await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } }))?.balance || 0
  console.log('账本总计:', totalLedger, '用户余额:', userBalance, '匹配:', totalLedger === userBalance)
}

demo()
  .catch(console.error)
  .finally(() => prisma.$disconnect())