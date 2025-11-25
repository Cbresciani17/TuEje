// app/lib/useCurrency.ts
// Lógica de API Externa y Conversión de Moneda

export const CURRENCIES = [
  { code: 'USD', name: 'Dólar Americano', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$', flag: '🇨🇱' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷' },
  // Agrega más monedas según necesidad
];

export async function getExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );
    if (!res.ok) throw new Error('Failed to fetch exchange rates');
    const data = await res.json();
    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates, returning default rates:", error);
    // Retornar tasas por defecto si la API falla (asumiendo USD es base 1)
    return { USD: 1, EUR: 0.9, CLP: 950, ARS: 360 };
  }
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency || Object.keys(rates).length === 0) {
    return amount;
  }
  
  // Normalizar a USD (asumiendo que rates se cargó con USD como base, rates['USD'] = 1)
  const amountInUSD = amount / (rates[fromCurrency] || 1);
  // Convertir a la moneda destino
  return amountInUSD * (rates[toCurrency] || 1);
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code;
}

export function getCurrencyFlag(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.flag ?? '';
}