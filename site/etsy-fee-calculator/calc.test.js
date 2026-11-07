const assert = require('assert');
const { computeFees, REGIONS } = require('./calc.js');

const near = (actual, expected, label) =>
  assert.ok(Math.abs(actual - expected) < 0.005, `${label}: expected ${expected}, got ${actual}`);

const us = Object.assign({}, REGIONS.us, {
  price: 25, shipping: 5, discount: 0, itemCost: 6, shippingCost: 4.5,
  offsiteAdsPct: 0, regulatoryPct: 0, quantity: 1, targetMarginPct: 30
});

// US example: order total 30.00
let r = computeFees(us);
near(r.orderTotal, 30, 'order total');
near(r.listing, 0.20, 'listing');
near(r.transaction, 1.95, 'transaction');
near(r.processing, 1.15, 'processing');
near(r.totalFees, 3.30, 'total fees');
// 30 - 3.30 fees - 6 item cost - 4.50 shipping cost = 16.20
near(r.netProfit, 16.20, 'net profit');
near(r.margin, 0.54, 'margin');

// Break-even check: at the recommended price the margin equals the target
const be = computeFees(Object.assign({}, us, { price: r.breakEvenPrice }));
near(be.margin, 0.30, 'break-even margin');

// Offsite Ads 15%: 0.15 * 30 = 4.50 extra
r = computeFees(Object.assign({}, us, { offsiteAdsPct: 15 }));
near(r.offsiteAds, 4.50, 'offsite ads 15%');
near(r.totalFees, 7.80, 'total fees with ads');
near(r.netProfit, 11.70, 'net profit with ads');

// Offsite Ads cap at 100
r = computeFees(Object.assign({}, us, { price: 1000, offsiteAdsPct: 15 }));
near(r.offsiteAds, 100, 'offsite ads cap');

// Quantity 2: listing fee per item, item cost per item
r = computeFees(Object.assign({}, us, { quantity: 2 }));
near(r.listing, 0.40, 'listing qty 2');
near(r.orderTotal, 55, 'order total qty 2');

// Impossible target margin
assert.strictEqual(computeFees(Object.assign({}, us, { targetMarginPct: 95 })).breakEvenPrice, null);

console.log('All calc tests passed.');
