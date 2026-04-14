import { NextResponse } from "next/server"

export async function POST() {
  const res = await fetch(
    `https://conjunto-api.onrender.com/reentrenar?token=${process.env.REENTRENAR_TOKEN}`,
    { method: "POST" }
  )
  const data = await res.json()
  return NextResponse.json(data)
}