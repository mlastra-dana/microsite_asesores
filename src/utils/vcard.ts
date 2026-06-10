import type { Advisor } from '../data/advisors';

export function downloadVCard(advisor: Advisor) {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${advisor.name}`,
    `ORG:${advisor.company}`,
    `TITLE:${advisor.role}`,
    `TEL:${advisor.phone}`,
    `EMAIL:${advisor.email}`,
    'END:VCARD',
  ].join('\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${advisor.id}.vcf`;
  link.click();
  URL.revokeObjectURL(url);
}
