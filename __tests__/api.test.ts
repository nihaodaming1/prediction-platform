import { NextRequest } from 'next/server'
import { POST as deposit } from '../app/api/users/[id]/deposit/route'
import { POST as bet } from '../app/api/bets/route'
import { POST as settle } from '../app/api/bets/[id]/settle/route'
import { POST as cancel } from '../app/api/bets/[id]/cancel/route'
import { GET as reconcile } from '../app/api/admin/reconcile/route'
import { prisma } from '../lib/prisma'

describe('Prediction Platform API - With Data Persistence', () => {
  beforeAll(async () => {
    await prisma.$connect()
    // Clear all data at start
    await prisma.ledger.deleteMany()
    await prisma.bet.deleteMany()
    await prisma.deposit.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // Remove beforeEach to keep data for inspection

  test('存款成功并正确更新余额', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser1', balance: 0 }
    })

    const request = new NextRequest(`http://localhost/api/users/${user.id}/deposit`, {
      method: 'POST',
      headers: { 'Idempotency-Key': 'key1' },
      body: JSON.stringify({ amount: 100 })
    })

    const response = await deposit(request, { params: { id: user.id.toString() } })
    expect(response.status).toBe(200)

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
    expect(updatedUser?.balance).toBe(100)
  })

  test('存款幂等性验证', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser2', balance: 0 }
    })

    // 相同Idempotency-Key重复请求只生效一次
    const request1 = new NextRequest(`http://localhost/api/users/${user.id}/deposit`, {
      method: 'POST',
      headers: { 'Idempotency-Key': 'key2' },
      body: JSON.stringify({ amount: 100 })
    })

    await deposit(request1, { params: { id: user.id.toString() } })

    const request2 = new NextRequest(`http://localhost/api/users/${user.id}/deposit`, {
      method: 'POST',
      headers: { 'Idempotency-Key': 'key2' },
      body: JSON.stringify({ amount: 100 })
    })

    const response = await deposit(request2, { params: { id: user.id.toString() } })
    expect(response.status).toBe(200) // Should succeed with same amount

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
    expect(updatedUser?.balance).toBe(100) // Balance should not double

    // 相同Key不同金额应返回409 Conflict
    const request3 = new NextRequest(`http://localhost/api/users/${user.id}/deposit`, {
      method: 'POST',
      headers: { 'Idempotency-Key': 'key2' },
      body: JSON.stringify({ amount: 200 })
    })

    const response3 = await deposit(request3, { params: { id: user.id.toString() } })
    expect(response3.status).toBe(409)
  })

  test('下注余额不足时注单应失败', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser3', balance: 50 }
    })

    const request = new NextRequest('http://localhost/api/bets', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'betkey1' },
      body: JSON.stringify({ userId: user.id, gameId: 'game1', amount: 100 })
    })

    const response = await bet(request)
    expect(response.status).toBe(400)
  })

  test('下注成功', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser4', balance: 100 }
    })

    const request = new NextRequest('http://localhost/api/bets', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'betkey2' },
      body: JSON.stringify({ userId: user.id, gameId: 'game1', amount: 50 })
    })

    const response = await bet(request)
    expect(response.status).toBe(200)

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
    expect(updatedUser?.balance).toBe(50)
  })

  test('结算为WIN时奖金正确发放', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser5', balance: 100 }
    })

    const betRecord = await prisma.bet.create({
      data: { userId: user.id, gameId: 'game1', amount: 50 }
    })

    const request = new NextRequest(`http://localhost/api/bets/${betRecord.id}/settle`, {
      method: 'POST',
      body: JSON.stringify({ result: 'WIN' })
    })

    const response = await settle(request, { params: { id: betRecord.id.toString() } })
    expect(response.status).toBe(200)

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
    expect(updatedUser?.balance).toBe(200) // 100 - 50 + 100 (win)
  })

  test('取消注单', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser6', balance: 100 }
    })

    const betRecord = await prisma.bet.create({
      data: { userId: user.id, gameId: 'game1', amount: 50 }
    })

    // Simulate bet deduction
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: 50 } }
    })

    const request = new NextRequest(`http://localhost/api/bets/${betRecord.id}/cancel`, {
      method: 'POST'
    })

    const response = await cancel(request, { params: { id: betRecord.id.toString() } })
    expect(response.status).toBe(200)

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
    expect(updatedUser?.balance).toBe(100) // Refunded
  })
})