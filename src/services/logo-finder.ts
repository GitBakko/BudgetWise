'use server';

/**
 * @fileOverview A simple service to find a logo URL for a given company name.
 * In a real-world scenario, this would use a proper logo-finding API.
 */

const logoMap: Record<string, string> = {
  'intesa san paolo': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Logo_Intesa_Sanpaolo.svg',
  'poste italiane': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Poste_Italiane_logo.svg/2560px-Poste_Italiane_logo.svg.png',
  'revolut': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Revolut_logo.svg/1200px-Revolut_logo.svg.png',
  'n26': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/N26_logo.svg/1280px-N26_logo.svg.png',
  'unicredit': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Unicredit_logo_2017.svg/2560px-Unicredit_logo_2017.svg.png',
};

export async function findLogoUrl(companyName: string): Promise<string | null> {
  const normalizedName = companyName.toLowerCase().trim();
  
  for (const key in logoMap) {
    if (normalizedName.includes(key)) {
      return logoMap[key];
    }
  }

  return null;
}
