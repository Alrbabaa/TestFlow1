import { TesterApplication, AppCampaign } from '../types';

export interface ExportTestersOptions {
  applications: TesterApplication[];
  campaigns?: AppCampaign[];
  mode?: 'full' | 'gmail_only';
  filename?: string;
}

/**
 * Cleanly format and download a CSV file with UTF-8 BOM so Arabic text renders perfectly in Excel & Sheets
 */
export function exportTestersToCsv({
  applications,
  campaigns = [],
  mode = 'full',
  filename,
}: ExportTestersOptions): void {
  if (!applications || applications.length === 0) {
    alert('لا يوجد مختبرون لتصديرهم حالياً.');
    return;
  }

  const campaignMap = new Map<string, string>();
  campaigns.forEach((c) => campaignMap.set(c.id, c.name));

  let csvContent = '';

  if (mode === 'gmail_only') {
    // Gmail Only CSV - Ideal for direct Google Play Console email list import
    const rows = ['gmail'];
    const emailsSet = new Set<string>();

    applications.forEach((app) => {
      const email = (app.googlePlayEmail || app.testerEmail || '').trim().toLowerCase();
      if (email && !emailsSet.has(email)) {
        emailsSet.add(email);
        rows.push(`"${email.replace(/"/g, '""')}"`);
      }
    });

    csvContent = rows.join('\r\n');
  } else {
    // Full CSV with comprehensive tester data
    const headers = [
      'tester_name',
      'gmail',
      'app_name',
      'device_type',
      'os_type',
      'os_version',
      'country',
      'status',
      'campaign_name',
      'created_at',
    ];

    const rows = [headers.join(',')];

    applications.forEach((app) => {
      const campaignName = campaignMap.get(app.campaignId) || app.appName || '';
      const email = app.googlePlayEmail || app.testerEmail || '';
      const row = [
        app.testerName || '',
        email,
        app.appName || '',
        app.deviceModel || '',
        app.osType || '',
        app.osVersion || '',
        app.testerCountry || '',
        app.status || '',
        campaignName,
        app.appliedAt || '',
      ].map((val) => `"${String(val).replace(/"/g, '""')}"`);

      rows.push(row.join(','));
    });

    csvContent = rows.join('\r\n');
  }

  // Prepend UTF-8 Byte Order Mark (\uFEFF) to ensure Microsoft Excel and other tools correctly decode UTF-8 Arabic characters
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const defaultName =
    mode === 'gmail_only'
      ? `testflow-gmail-list-${new Date().toISOString().split('T')[0]}.csv`
      : `testflow-testers-export-${new Date().toISOString().split('T')[0]}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename || defaultName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy clean Gmail addresses to clipboard ready to paste into Google Play Console
 */
export async function copyTesterGmailsToClipboard(
  applications: TesterApplication[],
  format: 'comma' | 'lines' = 'comma'
): Promise<number> {
  if (!applications || applications.length === 0) {
    return 0;
  }

  const emailsSet = new Set<string>();
  applications.forEach((app) => {
    const email = (app.googlePlayEmail || app.testerEmail || '').trim().toLowerCase();
    if (email) {
      emailsSet.add(email);
    }
  });

  const uniqueEmails = Array.from(emailsSet);
  if (uniqueEmails.length === 0) return 0;

  const output =
    format === 'lines' ? uniqueEmails.join('\n') : uniqueEmails.join(', ');

  await navigator.clipboard.writeText(output);
  return uniqueEmails.length;
}
