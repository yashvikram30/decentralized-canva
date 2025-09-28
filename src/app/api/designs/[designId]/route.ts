import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserDesign } from '@/models/UserDesign';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ designId: string }> }
) {
  try {
    const { designId } = await params;

    if (!designId) {
      return NextResponse.json({ error: 'Design ID is required' }, { status: 400 });
    }

    await connectDB();

    const design = await UserDesign.findOne({ designId });
    
    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // Update last accessed time
    design.metadata.lastModified = new Date();
    await design.save();

    return NextResponse.json({ canvasData: design.canvasData });
  } catch (error) {
    console.error('Error loading design:', error);
    return NextResponse.json({ error: 'Failed to load design' }, { status: 500 });
  }
}
