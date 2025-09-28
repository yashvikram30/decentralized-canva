import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserDesign } from '@/models/UserDesign';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    await connectDB();

    const designs = await UserDesign
      .find({ walletAddress })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ designs });
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, name, canvasData, blobId } = body;

    if (!walletAddress || !name || !canvasData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const designId = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const design = new UserDesign({
      walletAddress,
      designId,
      name,
      canvasData,
      blobId,
      metadata: {
        canvasSize: {
          width: canvasData.width || 800,
          height: canvasData.height || 600
        },
        elementCount: canvasData.objects ? canvasData.objects.length : 0,
        lastModified: new Date()
      }
    });

    const savedDesign = await design.save();
    
    return NextResponse.json({ 
      success: true, 
      designId: savedDesign.designId,
      design: savedDesign.toObject()
    });
  } catch (error) {
    console.error('Error saving design:', error);
    return NextResponse.json({ error: 'Failed to save design' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('designId');

    if (!designId) {
      return NextResponse.json({ error: 'Design ID is required' }, { status: 400 });
    }

    await connectDB();

    const result = await UserDesign.deleteOne({ designId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting design:', error);
    return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 });
  }
}
