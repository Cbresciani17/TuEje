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
    // 💡 URL de ejemplo de tu código original (se asume que la API existe)
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    if (!res.ok) throw new Error('Failed to fetch exchange rates');
    const data = await res.json();
    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    // Retornar tasas por defecto si la API falla (1:1 con USD para el demo)
    return { USD: 1, EUR: 0.9, CLP: 950, ARS: 360, ...Object.fromEntries(CURRENCIES.map(c => [c.code, 1])) };
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
  
  // Normalizar a USD (asumiendo que rates es relativo a USD, según tu código base)
  const rateToUSD = rates[fromCurrency] || 1;
  const rateFromUSD = rates[toCurrency] || 1;
  
  // Esta lógica asume que las tasas de la API son relativas a la base (USD en tu useEffect)
  if (rates['USD']) {
      // Valor base en USD (asumiendo USD es 1)
      const amountInUSD = amount / (rates[fromCurrency] || 1);
      // Conversión a la moneda destino
      return amountInUSD * (rates[toCurrency] || 1);
  }
  
  return amount;
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code;
}

export function getCurrencyFlag(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.flag ?? '';
}