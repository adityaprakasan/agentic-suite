import { NextRequest, NextResponse } from 'next/server';
import HTMLtoDOCX from 'html-to-docx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, fileName } = body;

    if (!content || !fileName) {
      return NextResponse.json(
        { error: 'Content and fileName are required' },
        { status: 400 }
      );
    }

    // Sanitize and prepare HTML content
    const sanitizedContent = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');

    const docxContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: Calibri, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
          }
          h1 { font-size: 16pt; font-weight: bold; margin: 12pt 0; }
          h2 { font-size: 14pt; font-weight: bold; margin: 10pt 0; }
          h3 { font-size: 12pt; font-weight: bold; margin: 8pt 0; }
          p { margin: 6pt 0; }
          ul, ol { margin: 6pt 0; padding-left: 36pt; }
          li { margin: 3pt 0; }
          blockquote { 
            margin: 6pt 0 6pt 36pt; 
            font-style: italic; 
          }
          pre { 
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            background-color: #f5f5f5;
            padding: 6pt;
            margin: 6pt 0;
          }
          code { 
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            background-color: #f5f5f5;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 6pt 0;
          }
          th, td { 
            border: 1px solid #d0d0d0; 
            padding: 4pt 8pt; 
          }
          th { 
            background-color: #f0f0f0; 
            font-weight: bold;
          }
          strong, b { font-weight: bold; }
          em, i { font-style: italic; }
          u { text-decoration: underline; }
          strike, del { text-decoration: line-through; }
          a { color: #0066cc; text-decoration: underline; }
          hr { 
            border: none; 
            border-top: 1px solid #cccccc; 
            margin: 12pt 0; 
          }
        </style>
      </head>
      <body>
        ${sanitizedContent}
      </body>
      </html>
    `;

    const docxOptions = {
      orientation: 'portrait' as const,
      margins: {
        top: 720,
        bottom: 720,
        left: 720,
        right: 720,
      },
      title: fileName,
      creator: 'Adentic AI',
      description: 'Document exported from Adentic AI',
      font: 'Calibri',
      fontSize: 22,
    };

    // Generate DOCX buffer
    const docxBuffer = await HTMLtoDOCX(docxContent, null, docxOptions);
    
    // Ensure we have a proper Uint8Array for the response
    let responseData: Uint8Array;
    if (Buffer.isBuffer(docxBuffer)) {
      responseData = new Uint8Array(docxBuffer);
    } else if (docxBuffer instanceof ArrayBuffer) {
      responseData = new Uint8Array(docxBuffer);
    } else if (docxBuffer instanceof Blob) {
      const arrayBuffer = await docxBuffer.arrayBuffer();
      responseData = new Uint8Array(arrayBuffer);
    } else {
      // Try to convert to buffer
      responseData = new Uint8Array(Buffer.from(docxBuffer as any));
    }

    // Sanitize filename for Content-Disposition header
    const safeFileName = fileName.replace(/[^a-zA-Z0-9\-_\s]/g, '').trim() || 'document';

    return new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeFileName}.docx"`,
        'Content-Length': String(responseData.byteLength),
      },
    });
  } catch (error) {
    console.error('DOCX export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('DOCX export stack:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate DOCX file', 
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
