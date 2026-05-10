import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    const { amount }: { amount: number } = await request.json()
    const idempotencyKey = request.headers.get('Idempotency-Key')

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Idempotency-Key required' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    // Check if deposit already exists
    const existingDeposit = await prisma.deposit.findUnique({
      where: { idempotencyKey }
    })

    if (existingDeposit) {
      if (existingDeposit.amount !== amount) {
        return NextResponse.json({ error: 'Idempotency key conflict' }, { status: 409 })
      }
      return NextResponse.json({ message: 'Deposit already processed' })
    }

    // Create deposit and update balance in transaction
    await prisma.$transaction(async (tx) => {
      await tx.deposit.create({
        data: {
          userId,
          amount,
          idempotencyKey
        }
      })

      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } }
      })

      await tx.ledger.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount
        }
      })
    })

    return NextResponse.json({ message: 'Deposit successful' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}