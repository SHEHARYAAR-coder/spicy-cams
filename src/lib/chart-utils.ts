/**
 * Generates dynamic chart data that reflects the actual value
 * Creates a trend showing growth from a lower starting point to the current value
 * @param currentValue - The current/latest value to display
 * @param dataPoints - Number of data points to generate (default: 8)
 * @param growthPattern - Type of growth pattern: 'increasing', 'fluctuating', or 'stable'
 * @returns Array of numbers representing the chart data
 */
export function generateChartData(
  currentValue: number,
  dataPoints: number = 8,
  growthPattern: "increasing" | "fluctuating" | "stable" = "increasing"
): number[] {
  if (currentValue === 0) {
    return Array(dataPoints).fill(0);
  }

  const data: number[] = [];
  
  switch (growthPattern) {
    case "increasing":
      // Create a progressive growth trend
      for (let i = 0; i < dataPoints; i++) {
        const progress = i / (dataPoints - 1);
        // Use exponential growth for more realistic progression
        const value = currentValue * Math.pow(progress, 1.5) * (0.3 + 0.7 * progress);
        data.push(Math.round(value * 10) / 10); // Round to 1 decimal
      }
      // Ensure last value is exactly the current value
      data[dataPoints - 1] = currentValue;
      break;

    case "fluctuating":
      // Create fluctuating data around a trend
      for (let i = 0; i < dataPoints; i++) {
        const progress = i / (dataPoints - 1);
        const baseValue = currentValue * (0.3 + 0.7 * progress);
        // Add some randomness (±15%) based on index for consistent results
        const variance = Math.sin(i * 2.5) * 0.15;
        const value = baseValue * (1 + variance);
        data.push(Math.round(value * 10) / 10);
      }
      // Ensure last value is exactly the current value
      data[dataPoints - 1] = currentValue;
      break;

    case "stable":
      // Create relatively stable data with minor variations
      for (let i = 0; i < dataPoints; i++) {
        const progress = i / (dataPoints - 1);
        const baseValue = currentValue * (0.85 + 0.15 * progress);
        // Add minimal randomness (±5%)
        const variance = Math.sin(i * 1.8) * 0.05;
        const value = baseValue * (1 + variance);
        data.push(Math.round(value * 10) / 10);
      }
      // Ensure last value is exactly the current value
      data[dataPoints - 1] = currentValue;
      break;
  }

  // Ensure no negative values
  return data.map(v => Math.max(0, v));
}

/**
 * Generates chart data for percentage or ratio values (0-100 range)
 * @param currentValue - The current percentage/ratio value
 * @param dataPoints - Number of data points to generate
 * @param pattern - Growth pattern type
 * @returns Array of numbers in the 0-100 range
 */
export function generatePercentageChartData(
  currentValue: number,
  dataPoints: number = 8,
  pattern: "increasing" | "fluctuating" | "stable" = "fluctuating"
): number[] {
  const data = generateChartData(currentValue, dataPoints, pattern);
  // Clamp values between 0 and 100
  return data.map(v => Math.min(100, Math.max(0, v)));
}
