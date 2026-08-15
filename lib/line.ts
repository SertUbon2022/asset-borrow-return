interface BorrowNotificationData {
  requestId: number;
  userName: string;
  userDepartment?: string | null;
  assetName: string;
  assetTag: string;
  categoryName?: string;
  imageUrl?: string | null;
  requestDate: Date;
  expectedReturnDate: Date;
  durationDays: number;
  purpose: string;
}

/**
 * Gets the canonical application URL with smart fallback for Vercel environments
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }
  return 'http://localhost:3000';
}

/**
 * Constructs a PWA CI styled LINE Flex Message JSON payload
 */
export function buildBorrowRequestFlexMessage(data: BorrowNotificationData) {
  const requestDateStr = data.requestDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const returnDateStr = data.expectedReturnDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const appUrl = getAppUrl();
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;

  // Build URLs with LIFF if available for seamless in-app LINE experience
  const baseUrl = liffId && liffId.trim() !== ''
    ? `https://liff.line.me/${liffId.trim()}`
    : appUrl;

  const viewUrl = `${baseUrl}/admin/requests?highlight=${data.requestId}`;

  const defaultFallbackImage = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800';
  let displayImage = data.imageUrl?.trim() || defaultFallbackImage;
  if (displayImage.startsWith('/')) {
    displayImage = `${appUrl}${displayImage}`;
  }

  return {
    type: 'flex',
    altText: `📋 คำขอยืมอุปกรณ์ใหม่: ${data.assetName} โดย ${data.userName}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#003366',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '💧 การประปาส่วนภูมิภาค (กปภ.)',
            color: '#E5A823',
            size: 'xs',
            weight: 'bold',
          },
          {
            type: 'text',
            text: 'แจ้งเตือนคำขอยืมอุปกรณ์ใหม่',
            color: '#FFFFFF',
            size: 'md',
            weight: 'bold',
            wrap: true,
            margin: 'xs',
          },
          {
            type: 'text',
            text: 'PWA IT Asset Flow System',
            color: '#00A8FF',
            size: 'xxs',
            margin: 'xs',
          },
        ],
      },
      hero: {
        type: 'image',
        url: displayImage,
        size: 'full',
        aspectRatio: '20:11',
        aspectMode: 'cover',
        action: {
          type: 'uri',
          uri: viewUrl,
        },
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '16px',
        contents: [
          // 1. Status Bar
          {
            type: 'box',
            layout: 'horizontal',
            justifyContent: 'space-between',
            alignItems: 'center',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                backgroundColor: '#EFF6FF',
                cornerRadius: 'md',
                paddingStart: 'md',
                paddingEnd: 'md',
                paddingTop: 'xs',
                paddingBottom: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: `คำขอ #${data.requestId}`,
                    color: '#0072BC',
                    size: 'xs',
                    weight: 'bold',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                backgroundColor: '#FEF3C7',
                cornerRadius: 'md',
                paddingStart: 'md',
                paddingEnd: 'md',
                paddingTop: 'xs',
                paddingBottom: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: '⏳ รอการอนุมัติ',
                    color: '#B45309',
                    size: 'xs',
                    weight: 'bold',
                  },
                ],
              },
            ],
          },
          // 2. Asset Box
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#F8FAFC',
            cornerRadius: 'lg',
            paddingAll: '12px',
            borderColor: '#CBD5E1',
            borderWidth: '1px',
            contents: [
              {
                type: 'text',
                text: data.assetName,
                color: '#003366',
                size: 'md',
                weight: 'bold',
                wrap: true,
              },
              {
                type: 'box',
                layout: 'baseline',
                margin: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: 'รหัสครุภัณฑ์: ',
                    color: '#64748B',
                    size: 'xs',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: data.assetTag,
                    color: '#0F172A',
                    size: 'xs',
                    weight: 'bold',
                    flex: 0,
                  },
                  ...(data.categoryName
                    ? [
                        {
                          type: 'text' as const,
                          text: ` • ${data.categoryName}`,
                          color: '#0072BC',
                          size: 'xs' as const,
                          weight: 'bold' as const,
                          flex: 1,
                        },
                      ]
                    : []),
                ],
              },
            ],
          },
          // 3. Divider
          {
            type: 'separator',
            color: '#E2E8F0',
          },
          // 4. Details List
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '👤 ผู้ขอยืม:',
                    color: '#64748B',
                    size: 'xs',
                    flex: 3,
                  },
                  {
                    type: 'text',
                    text: `${data.userName} (${data.userDepartment || 'กปภ.'})`,
                    color: '#0F172A',
                    size: 'xs',
                    weight: 'bold',
                    wrap: true,
                    flex: 7,
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '📅 วันที่ยื่นขอ:',
                    color: '#64748B',
                    size: 'xs',
                    flex: 3,
                  },
                  {
                    type: 'text',
                    text: requestDateStr,
                    color: '#334155',
                    size: 'xs',
                    flex: 7,
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '⏱️ กำหนดคืน:',
                    color: '#64748B',
                    size: 'xs',
                    flex: 3,
                  },
                  {
                    type: 'text',
                    text: `${returnDateStr} (${data.durationDays} วัน)`,
                    color: '#0072BC',
                    size: 'xs',
                    weight: 'bold',
                    flex: 7,
                  },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#F1F5F9',
                cornerRadius: 'md',
                paddingAll: '8px',
                margin: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: '🎯 วัตถุประสงค์การยืม:',
                    color: '#475569',
                    size: 'xxs',
                    weight: 'bold',
                  },
                  {
                    type: 'text',
                    text: data.purpose,
                    color: '#1E293B',
                    size: 'xs',
                    wrap: true,
                    margin: 'xs',
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        paddingTop: 'none',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '✅ อนุมัติคำขอยืมอุปกรณ์',
              data: `action=approve&requestId=${data.requestId}`,
            },
            style: 'primary',
            color: '#0072BC',
            height: 'sm',
          },
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '❌ ปฏิเสธคำขอนี้',
              data: `action=reject&requestId=${data.requestId}`,
            },
            style: 'primary',
            color: '#003366',
            height: 'sm',
          },
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '🔍 ตรวจสอบรายละเอียดในระบบ',
              uri: viewUrl,
            },
            style: 'link',
            color: '#0072BC',
            height: 'sm',
          },
        ],
      },
    },
  };
}

/**
 * Sends LINE Flex Message to configured LINE Group / User via Messaging API
 */
export async function sendBorrowRequestLineNotification(data: BorrowNotificationData): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_GROUP_ID;

  if (!token) {
    console.warn('[LINE API] Skipped: LINE_CHANNEL_ACCESS_TOKEN is missing in environment variables.');
    return false;
  }

  const flexPayload = buildBorrowRequestFlexMessage(data);

  try {
    let endpoint = 'https://api.line.me/v2/bot/message/broadcast';
    let bodyData: { to?: string; messages: unknown[] } = { messages: [flexPayload] };

    // If LINE_GROUP_ID or target ID is specified, use push message endpoint instead of broadcast
    if (groupId && groupId.trim() !== '') {
      endpoint = 'https://api.line.me/v2/bot/message/push';
      bodyData = {
        to: groupId.trim(),
        messages: [flexPayload],
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LINE API Error] HTTP ${response.status}: ${errorText}`);
      return false;
    }

    console.log(`[LINE API Success] Notification sent for Request #${data.requestId}`);
    return true;
  } catch (error) {
    console.error('[LINE API Exception] Failed to send notification:', error);
    return false;
  }
}

export interface LineGroupMemberProfile {
  isMember: boolean;
  displayName?: string;
  userId?: string;
  pictureUrl?: string;
  error?: string;
}

/**
 * Verifies whether a given LINE User ID is a member of the designated LINE Group.
 * Calls LINE Messaging API GET /v2/bot/group/{groupId}/member/{userId}
 */
export async function verifyUserInLineGroup(lineUserId: string): Promise<LineGroupMemberProfile> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_GROUP_ID;

  if (!token) {
    return {
      isMember: false,
      error: 'ระบบยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN กรุณาติดต่อผู้ดูแลระบบ',
    };
  }

  if (!groupId || groupId.trim() === '') {
    return {
      isMember: false,
      error: 'ระบบยังไม่ได้ตั้งค่า LINE_GROUP_ID เป้าหมาย กรุณาติดต่อผู้ดูแลระบบ',
    };
  }

  try {
    const trimmedUserId = lineUserId.trim();
    const trimmedGroupId = groupId.trim();

    // Call LINE Group Member Profile endpoint
    const response = await fetch(
      `https://api.line.me/v2/bot/group/${trimmedGroupId}/member/${trimmedUserId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        isMember: true,
        displayName: data.displayName,
        userId: data.userId,
        pictureUrl: data.pictureUrl,
      };
    }

    if (response.status === 404) {
      return {
        isMember: false,
        error: 'ไม่พบบัญชี LINE ของท่านในกลุ่ม LINE ทางการของระบบ (กรุณาตรวจสอบว่าได้เข้าร่วมกลุ่ม LINE ที่กำหนดและบอทอยู่ในกลุ่มแล้วหรือไม่)',
      };
    }

    const errText = await response.text();
    console.error(`[LINE API Group Member Check Error] Status ${response.status}: ${errText}`);
    return {
      isMember: false,
      error: `LINE API ตรวจสอบสมาชิกไม่สำเร็จ (รหัสสถานะ: ${response.status})`,
    };
  } catch (error) {
    console.error('[LINE API Exception] Failed to verify group member:', error);
    return {
      isMember: false,
      error: 'เกิดข้อผิดพลาดในการเชื่อมต่อไปยัง LINE API',
    };
  }
}

/**
 * Gets LINE Group Summary (Group Name & Icon)
 */
export async function getLineGroupSummary(): Promise<{
  groupId: string;
  groupName?: string;
  pictureUrl?: string;
} | null> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_GROUP_ID;

  if (!token || !groupId || groupId.trim() === '') {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/group/${groupId.trim()}/summary`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 300 },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        groupId: data.groupId,
        groupName: data.groupName,
        pictureUrl: data.pictureUrl,
      };
    }

    return { groupId: groupId.trim() };
  } catch {
    return { groupId: groupId.trim() };
  }
}

/**
 * Replies to a LINE event using replyToken
 */
export async function replyLineMessage(replyToken: string, messages: unknown[]): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !replyToken) {
    console.warn('[LINE Reply] Skipped: Token or ReplyToken missing.');
    return false;
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[LINE Reply Error] HTTP ${response.status}: ${errText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[LINE Reply Exception]:', error);
    return false;
  }
}

interface ActionResultData {
  requestId: number;
  assetName: string;
  assetTag: string;
  action: 'approve' | 'reject';
  adminName: string;
  borrowerName: string;
  processedAt: Date;
}

/**
 * Constructs a PWA CI styled LINE Flex Message acknowledging the Approve / Reject action in the group
 */
export function buildActionResultFlexMessage(data: ActionResultData) {
  const isApprove = data.action === 'approve';
  const headerBgColor = isApprove ? '#003366' : '#881337';
  const badgeBgColor = isApprove ? '#DCFCE7' : '#FFE4E6';
  const badgeTextColor = isApprove ? '#15803D' : '#BE123C';
  const statusTitle = isApprove ? 'อนุมัติคำขอยืมอุปกรณ์แล้ว' : 'ปฏิเสธคำขอยืมอุปกรณ์แล้ว';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const viewUrl = `${appUrl}/admin/requests?highlight=${data.requestId}`;

  const timeStr = data.processedAt.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    type: 'flex',
    altText: `📢 ${statusTitle} #${data.requestId} โดย ${data.adminName}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: headerBgColor,
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '💧 การประปาส่วนภูมิภาค (กปภ.)',
            color: '#E5A823',
            size: 'xs',
            weight: 'bold',
          },
          {
            type: 'text',
            text: statusTitle,
            color: '#FFFFFF',
            size: 'md',
            weight: 'bold',
            wrap: true,
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            justifyContent: 'space-between',
            alignItems: 'center',
            contents: [
              {
                type: 'text',
                text: `คำขอ #${data.requestId}`,
                color: '#0072BC',
                size: 'xs',
                weight: 'bold',
              },
              {
                type: 'box',
                layout: 'horizontal',
                backgroundColor: badgeBgColor,
                cornerRadius: 'md',
                paddingStart: 'md',
                paddingEnd: 'md',
                paddingTop: 'xs',
                paddingBottom: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: isApprove ? '✅ อนุมัติแล้ว' : '❌ ปฏิเสธคำขอ',
                    color: badgeTextColor,
                    size: 'xs',
                    weight: 'bold',
                  },
                ],
              },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#F8FAFC',
            cornerRadius: 'lg',
            paddingAll: '12px',
            borderColor: '#CBD5E1',
            borderWidth: '1px',
            contents: [
              {
                type: 'text',
                text: data.assetName,
                color: '#003366',
                size: 'sm',
                weight: 'bold',
                wrap: true,
              },
              {
                type: 'text',
                text: `รหัสครุภัณฑ์: ${data.assetTag}`,
                color: '#64748B',
                size: 'xs',
                margin: 'xs',
              },
            ],
          },
          {
            type: 'separator',
            color: '#E2E8F0',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: '👤 ผู้ขอยืม:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: data.borrowerName, color: '#1E293B', size: 'xs', weight: 'bold', flex: 7 },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: '🛡️ ดำเนินการโดย:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: `${data.adminName} (IT Admin)`, color: '#0072BC', size: 'xs', weight: 'bold', flex: 7 },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: '⏱️ เวลา:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: `${timeStr} น.`, color: '#334155', size: 'xs', flex: 7 },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        paddingTop: 'none',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '🔍 ตรวจสอบคำขอนี้ในระบบ',
              uri: viewUrl,
            },
            style: 'link',
            color: '#0072BC',
            height: 'sm',
          },
        ],
      },
    },
  };
}

export interface LineIdTokenVerificationResult {
  isValid: boolean;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  error?: string;
}

/**
 * Verifies LINE ID Token (JWT) directly with LINE OAuth 2.1 verify endpoint
 * POST https://api.line.me/oauth2/v2.1/verify
 */
export async function verifyLineIdToken(idToken: string): Promise<LineIdTokenVerificationResult> {
  const trimmedToken = idToken?.trim();
  if (!trimmedToken) {
    return { isValid: false, error: 'ไม่พบ LINE ID Token' };
  }

  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID?.trim();
  const channelId = process.env.LINE_CHANNEL_ID?.trim() || (liffId ? liffId.split('-')[0] : undefined);

  try {
    const params = new URLSearchParams();
    params.append('id_token', trimmedToken);
    if (channelId) {
      params.append('client_id', channelId);
    }

    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('[LINE ID Token Verification Failed]:', data);
      return {
        isValid: false,
        error: data.error_description || 'LINE ID Token ไม่ถูกต้องหรือหมดอายุ',
      };
    }

    return {
      isValid: true,
      userId: data.sub,
      displayName: data.name,
      pictureUrl: data.picture,
    };
  } catch (error) {
    console.error('[LINE ID Token Verification Exception]:', error);
    return {
      isValid: false,
      error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อตรวจสอบ LINE ID Token',
    };
  }
}


