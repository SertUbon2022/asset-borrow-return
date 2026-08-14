interface BorrowNotificationData {
  requestId: number;
  userName: string;
  userDepartment?: string | null;
  assetName: string;
  assetTag: string;
  categoryName?: string;
  requestDate: Date;
  expectedReturnDate: Date;
  durationDays: number;
  purpose: string;
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const actionUrl = `${appUrl}/admin/requests`;

  return {
    type: 'flex',
    altText: `🔔 แจ้งเตือนยืมอุปกรณ์ใหม่: ${data.assetName} โดย ${data.userName}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0072BC',
        paddingAll: 'lg',
        contents: [
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'text',
                text: 'การประปาส่วนภูมิภาค (กปภ.)',
                color: '#E5A823',
                size: 'xs',
                weight: 'bold',
                flex: 0,
              },
            ],
          },
          {
            type: 'text',
            text: '🔔 แจ้งเตือนคำขอยืมอุปกรณ์ใหม่',
            color: '#FFFFFF',
            size: 'lg',
            weight: 'bold',
            margin: 'sm',
          },
          {
            type: 'text',
            text: 'PWA Enterprise IT Asset Flow System',
            color: '#E0F2FE',
            size: 'xxs',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: 'lg',
        contents: [
          // Top Request Badge & Status
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
                paddingStart: 'sm',
                paddingEnd: 'sm',
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
                paddingStart: 'sm',
                paddingEnd: 'sm',
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
          // Asset Box
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#F8FAFC',
            cornerRadius: 'lg',
            paddingAll: 'md',
            borderColor: '#E2E8F0',
            borderWidth: '1px',
            margin: 'sm',
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
                    text: `รหัสครุภัณฑ์: ${data.assetTag}`,
                    color: '#64748B',
                    size: 'xs',
                  },
                  ...(data.categoryName
                    ? [
                        {
                          type: 'text' as const,
                          text: ` • ${data.categoryName}`,
                          color: '#0072BC',
                          size: 'xs' as const,
                          weight: 'bold' as const,
                        },
                      ]
                    : []),
                ],
              },
            ],
          },
          // Divider
          {
            type: 'separator',
            color: '#F1F5F9',
            margin: 'md',
          },
          // Detail Rows
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'md',
            contents: [
              // Row 1: User
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '👤 ผู้ยืม:',
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
              // Row 2: Request Date
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
              // Row 3: Return Date & Duration
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
              // Row 4: Purpose
              {
                type: 'box',
                layout: 'vertical',
                margin: 'sm',
                backgroundColor: '#F1F5F9',
                cornerRadius: 'md',
                paddingAll: 'sm',
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
        paddingAll: 'lg',
        paddingTop: 'none',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'ตรวจสอบ & อนุมัติคำขอ',
              uri: actionUrl,
            },
            style: 'primary',
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
