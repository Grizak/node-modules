# PercentCalculator

A comprehensive JavaScript utility class for percentage calculations. Simple, lightweight, and powerful - perfect for financial applications, data analysis, or any project requiring percentage computations.

## Features

- ✅ Zero dependencies
- ✅ ES6+ and CommonJS support
- ✅ Comprehensive percentage calculations
- ✅ Error handling for edge cases
- ✅ TypeScript-friendly
- ✅ Lightweight (~2KB minified)
- ✅ Well-tested and documented

## Installation

```bash
npm install percent-calculator
```

## Quick Start

```javascript
import PercentCalculator from 'percent-calculator';

// What percentage is 25 of 100?
const result = PercentCalculator.percentOf(25, 100); // 25

// What is 20% of 150?
const amount = PercentCalculator.calculatePercentage(20, 150); // 30

// Add 15% tip to a $50 bill
const total = PercentCalculator.addPercent(50, 15); // 57.5
```

## API Reference

### Basic Calculations

#### `percentOf(part, whole)`
Calculate what percentage one number is of another.

```javascript
PercentCalculator.percentOf(25, 100); // 25
PercentCalculator.percentOf(3, 4); // 75
```

#### `calculatePercentage(percent, number)`
Calculate a percentage of a number.

```javascript
PercentCalculator.calculatePercentage(20, 150); // 30
PercentCalculator.calculatePercentage(8.5, 200); // 17
```

#### `addPercent(number, percent)`
Add a percentage to a number.

```javascript
PercentCalculator.addPercent(100, 10); // 110
PercentCalculator.addPercent(50, 20); // 60
```

#### `subtractPercent(number, percent)`
Subtract a percentage from a number.

```javascript
PercentCalculator.subtractPercent(100, 10); // 90
PercentCalculator.subtractPercent(200, 25); // 150
```

### Advanced Calculations

#### `percentageChange(oldValue, newValue)`
Calculate percentage change between two numbers.

```javascript
PercentCalculator.percentageChange(100, 120); // 20 (20% increase)
PercentCalculator.percentageChange(100, 80);  // -20 (20% decrease)
```

#### `percentageIncrease(oldValue, newValue)`
Calculate percentage increase (returns 0 if decrease).

```javascript
PercentCalculator.percentageIncrease(100, 120); // 20
PercentCalculator.percentageIncrease(100, 80);  // 0
```

#### `percentageDecrease(oldValue, newValue)`
Calculate percentage decrease (returns 0 if increase).

```javascript
PercentCalculator.percentageDecrease(100, 80);  // 20
PercentCalculator.percentageDecrease(100, 120); // 0
```

#### `findWhole(percent, percentageValue)`
Find the whole number when you know the percentage and its value.

```javascript
PercentCalculator.findWhole(25, 50); // 200 (25% of 200 is 50)
PercentCalculator.findWhole(15, 30); // 200 (15% of 200 is 30)
```

#### `compound(initialValue, ...percentages)`
Apply multiple percentages sequentially (compound calculation).

```javascript
PercentCalculator.compound(100, 10, 5); // 115.5
// 100 + 10% = 110, then 110 + 5% = 115.5
```

### Utility Methods

#### `average(...percentages)`
Calculate the average of multiple percentages.

```javascript
PercentCalculator.average(10, 20, 30); // 20
PercentCalculator.average(15, 25, 35, 45); // 30
```

#### `round(percentage, decimals = 2)`
Round percentage to specified decimal places.

```javascript
PercentCalculator.round(33.333333, 2); // 33.33
PercentCalculator.round(66.666666, 1); // 66.7
```

#### `format(percentage, decimals = 2)`
Format percentage as string with % symbol.

```javascript
PercentCalculator.format(33.333333); // "33.33%"
PercentCalculator.format(66.666666, 1); // "66.7%"
```

## Real-World Examples

### Financial Calculations

```javascript
// Calculate tax on a purchase
const price = 100;
const taxRate = 8.5;
const tax = PercentCalculator.calculatePercentage(taxRate, price);
const total = price + tax;
console.log(`Total: $${total}`); // Total: $108.5

// Calculate discount
const originalPrice = 200;
const discountRate = 25;
const salePrice = PercentCalculator.subtractPercent(originalPrice, discountRate);
console.log(`Sale price: $${salePrice}`); // Sale price: $150

// Calculate tip
const billAmount = 85;
const tipPercent = 18;
const tip = PercentCalculator.calculatePercentage(tipPercent, billAmount);
const totalBill = billAmount + tip;
console.log(`Total with tip: $${totalBill}`); // Total with tip: $100.3
```

### Data Analysis

```javascript
// Track performance changes
const lastMonth = 1000;
const thisMonth = 1200;
const growth = PercentCalculator.percentageChange(lastMonth, thisMonth);
console.log(`Growth: ${PercentCalculator.format(growth)}`); // Growth: 20.00%

// Calculate completion rates
const totalTasks = 150;
const completedTasks = 127;
const completionRate = PercentCalculator.percentOf(completedTasks, totalTasks);
console.log(`Completion rate: ${PercentCalculator.format(completionRate)}`); // Completion rate: 84.67%
```

### Investment Calculations

```javascript
// Compound interest simulation
const principal = 1000;
const monthlyReturn = 2; // 2% per month
const months = 12;

// Calculate compound growth over 12 months
const finalAmount = PercentCalculator.compound(principal, ...Array(months).fill(monthlyReturn));
console.log(`After 12 months: $${finalAmount.toFixed(2)}`); // After 12 months: $1268.24

// Calculate total return percentage
const totalReturn = PercentCalculator.percentageChange(principal, finalAmount);
console.log(`Total return: ${PercentCalculator.format(totalReturn)}`); // Total return: 26.82%
```

## Error Handling

The library includes built-in error handling for common edge cases:

```javascript
// Division by zero
try {
  PercentCalculator.percentOf(50, 0);
} catch (error) {
  console.error(error.message); // "Cannot divide by zero"
}

// Percentage change from zero
try {
  PercentCalculator.percentageChange(0, 100);
} catch (error) {
  console.error(error.message); // "Cannot calculate percentage change from zero"
}

// Empty average calculation
try {
  PercentCalculator.average();
} catch (error) {
  console.error(error.message); // "No percentages provided"
}
```

## Browser Support

Works in all modern browsers and Node.js environments:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Node.js 14+

## CommonJS Usage

```javascript
const PercentCalculator = require('percent-calculator');

const result = PercentCalculator.percentOf(25, 100);
console.log(result); // 25
```

## TypeScript

While written in JavaScript, the library is TypeScript-friendly:

```typescript
import PercentCalculator from 'percent-calculator';

const percentage: number = PercentCalculator.percentOf(25, 100);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Core percentage calculation methods
- Advanced calculation features
- Comprehensive error handling
- Full test coverage