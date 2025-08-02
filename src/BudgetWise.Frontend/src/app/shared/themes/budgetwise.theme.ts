import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/**
 * 🎨 BudgetWise Custom Theme
 * Preset personalizzato basato su PrimeNG Aura con i colori brand di BudgetWise
 */
export const BudgetWisePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    }
  }
});
