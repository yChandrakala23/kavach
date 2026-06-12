/**
 * Utility to send SMS alerts using Fast2SMS API
 */

interface VitalsData {
  hr: number;
  spo2: number;
  temp: number;
  rr: number;
}

export async function sendKavachAlert(
  patientName: string,
  bedNumber: string,
  kewsScore: number,
  vitals: VitalsData,
  phoneNumber: string
): Promise<void> {
  if (!phoneNumber) {
    console.error('Phone number is required to send SMS alert.');
    return;
  }

  const message = `CRITICAL STATUS
Patient: ${patientName}
Bed: ${bedNumber}
KEWS Score: ${kewsScore}
Vitals: HR:${vitals.hr}, SpO2:${vitals.spo2}%, Temp:${vitals.temp}°C, RR:${vitals.rr}`;

  try {
    const response = await fetch('/api/send-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        phoneNumber,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`SMS alert request sent to server for ${phoneNumber}`);
    } else {
      console.error('Server failed to send SMS alert:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error calling alert proxy:', error);
  }
}
