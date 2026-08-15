import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, borrow_requests, activity_logs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { replyLineMessage, buildActionResultFlexMessage, getAppUrl } from '@/lib/line';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'LINE Messaging Webhook Endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events || [];

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ message: 'No events received' }, { status: 200 });
    }

    for (const event of events) {
      // 1. Handle Postback Events (User clicked Approve / Reject button)
      if (event.type === 'postback' && event.postback?.data) {
        const params = new URLSearchParams(event.postback.data);
        const action = params.get('action');
        const requestIdStr = params.get('requestId');
        const replyToken = event.replyToken;
        const senderUserId = event.source?.userId;

        if (!requestIdStr || !action || !['approve', 'reject'].includes(action)) {
          continue;
        }

        const requestId = Number(requestIdStr);

        // Check if the sender's LINE ID is bound to an IT Admin in our database
        if (!senderUserId) {
          if (replyToken) {
            await replyLineMessage(replyToken, [
              {
                type: 'text',
                text: '⚠️ ไม่สามารถระบุ LINE User ID ของผู้กดได้ กรุณาลองใหม่อีกครั้ง',
              },
            ]);
          }
          continue;
        }

        const adminUser = await db.query.users.findFirst({
          where: eq(users.line_user_id, senderUserId),
        });

        // Case 1: LINE User is NOT bound or NOT an Admin
        if (!adminUser || adminUser.role !== 'admin') {
          if (replyToken) {
            const appUrl = getAppUrl();
            const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
            const baseUrl = liffId && liffId.trim() !== '' ? `https://liff.line.me/${liffId.trim()}` : appUrl;
            const linkUrl = `${baseUrl}/admin/requests?highlight=${requestId}&action=${action}`;

            await replyLineMessage(replyToken, [
              {
                type: 'text',
                text: adminUser
                  ? `⚠️ ขออภัย คุณ ${adminUser.name} มีสิทธิ์เป็น "พนักงานทั่วไป" จึงไม่สามารถอนุมัติหรือปฏิเสธคำขอยืมอุปกรณ์ได้ (ต้องใช้สิทธิ์ IT Admin)`
                  : `⚠️ บัญชี LINE ของท่านยังไม่ได้ผูกกับบัญชีเจ้าหน้าที่ IT Admin ในระบบ\n\n👉 กรุณาผูกบัญชีเพื่อเปิดสิทธิ์อนุมัติ: ${linkUrl}`,
              },
            ]);
          }
          continue;
        }

        // Case 2: LINE User IS an IT Admin -> Fetch the borrow request
        const request = await db.query.borrow_requests.findFirst({
          where: eq(borrow_requests.id, requestId),
          with: {
            user: true,
            asset: true,
          },
        });

        if (!request) {
          if (replyToken) {
            await replyLineMessage(replyToken, [
              {
                type: 'text',
                text: `❌ ไม่พบข้อมูลคำขอยืม #${requestId} ในระบบ`,
              },
            ]);
          }
          continue;
        }

        // Check if request is already processed
        if (request.status !== 'pending') {
          const statusTextMap: Record<string, string> = {
            approved: 'อนุมัติแล้ว',
            rejected: 'ปฏิเสธแล้ว',
            borrowed: 'รับอุปกรณ์แล้ว',
            returned: 'คืนเรียบร้อยแล้ว',
            cancelled: 'ยกเลิกแล้ว',
          };
          const currentStatusText = statusTextMap[request.status] || request.status;

          if (replyToken) {
            await replyLineMessage(replyToken, [
              {
                type: 'text',
                text: `ℹ️ คำขอยืม #${requestId} (${request.asset.name}) ได้รับการประมวลผลแล้ว (สถานะปัจจุบัน: ${currentStatusText})`,
              },
            ]);
          }
          continue;
        }

        const now = new Date();

        // Perform the Approval / Rejection
        if (action === 'approve') {
          await db
            .update(borrow_requests)
            .set({
              status: 'approved',
              approved_by: adminUser.id,
              approved_at: now,
              updated_at: now,
            })
            .where(eq(borrow_requests.id, requestId));

          await db.insert(activity_logs).values({
            request_id: requestId,
            user_id: adminUser.id,
            action: 'อนุมัติคำขอยืมผ่าน LINE Group',
            details: `อนุมัติคำขอ #${requestId} (${request.asset.name}) โดย ${adminUser.name} ผ่านปุ่ม Postback ในกลุ่ม LINE`,
          });

          // Reply with confirmation Flex Message in group
          if (replyToken) {
            const flexMsg = buildActionResultFlexMessage({
              requestId,
              assetName: request.asset.name,
              assetTag: request.asset.asset_tag,
              action: 'approve',
              adminName: adminUser.name,
              borrowerName: request.user.name,
              processedAt: now,
            });
            await replyLineMessage(replyToken, [flexMsg]);
          }
        } else if (action === 'reject') {
          await db
            .update(borrow_requests)
            .set({
              status: 'rejected',
              approved_by: adminUser.id,
              approved_at: now,
              admin_note: `ปฏิเสธผ่าน LINE Group โดย ${adminUser.name}`,
              updated_at: now,
            })
            .where(eq(borrow_requests.id, requestId));

          await db.insert(activity_logs).values({
            request_id: requestId,
            user_id: adminUser.id,
            action: 'ปฏิเสธคำขอยืมผ่าน LINE Group',
            details: `ปฏิเสธคำขอ #${requestId} (${request.asset.name}) โดย ${adminUser.name} ผ่านปุ่ม Postback ในกลุ่ม LINE`,
          });

          // Reply with rejection Flex Message in group
          if (replyToken) {
            const flexMsg = buildActionResultFlexMessage({
              requestId,
              assetName: request.asset.name,
              assetTag: request.asset.asset_tag,
              action: 'reject',
              adminName: adminUser.name,
              borrowerName: request.user.name,
              processedAt: now,
            });
            await replyLineMessage(replyToken, [flexMsg]);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LINE Webhook Error]:', error);
    return NextResponse.json({ error: 'Webhook execution failed' }, { status: 500 });
  }
}
