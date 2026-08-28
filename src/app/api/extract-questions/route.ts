import { NextResponse } from "next/server";
import { demoAssessment } from "@/data/demo-data";
export async function POST() { return NextResponse.json({ questions: demoAssessment.questions }); }
