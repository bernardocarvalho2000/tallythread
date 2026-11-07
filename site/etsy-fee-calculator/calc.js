// Etsy fee & profit calculator. computeFees is pure; the DOM wiring below only runs in a browser.
var REGIONS = {
  us: { symbol: '$', listing: 0.20, transactionPct: 6.5, processingPct: 3, processingFixed: 0.25 },
  uk: { symbol: '£', listing: 0.20, transactionPct: 6.5, processingPct: 4, processingFixed: 0.20 },
  eu: { symbol: '€', listing: 0.20, transactionPct: 6.5, processingPct: 4, processingFixed: 0.30 },
  ca: { symbol: 'C$', listing: 0.20, transactionPct: 6.5, processingPct: 3, processingFixed: 0.25 },
  au: { symbol: 'A$', listing: 0.20, transactionPct: 6.5, processingPct: 3, processingFixed: 0.25 },
  custom: { symbol: '$', listing: 0.20, transactionPct: 6.5, processingPct: 3, processingFixed: 0.25 }
};

var OFFSITE_ADS_CAP = 100; // Etsy caps the Offsite Ads fee at 100 USD (or local equivalent) per order

function computeFees(i) {
  var n = function (v) { v = Number(v); return isFinite(v) ? v : 0; };
  var qty = Math.max(1, Math.floor(n(i.quantity) || 1));
  var price = n(i.price), shipping = n(i.shipping), discount = n(i.discount);
  var listingRate = n(i.listing), tPct = n(i.transactionPct) / 100;
  var pPct = n(i.processingPct) / 100, pFixed = n(i.processingFixed);
  var rPct = n(i.regulatoryPct) / 100, aPct = n(i.offsiteAdsPct) / 100;
  var itemCost = n(i.itemCost) * qty, shippingCost = n(i.shippingCost);

  var orderTotal = Math.max(0, price * qty + shipping - discount);
  var listing = listingRate * qty;
  var transaction = tPct * orderTotal;
  var processing = orderTotal > 0 ? pPct * orderTotal + pFixed : 0;
  var regulatory = rPct * orderTotal;
  var offsiteAds = Math.min(aPct * orderTotal, OFFSITE_ADS_CAP);
  var totalFees = listing + transaction + processing + regulatory + offsiteAds;
  var netProfit = orderTotal - totalFees - itemCost - shippingCost;
  var margin = orderTotal > 0 ? netProfit / orderTotal : 0;

  // Item price where profit / order total = target margin (ignores the Offsite Ads cap).
  var m = n(i.targetMarginPct) / 100;
  var den = 1 - tPct - pPct - rPct - aPct - m;
  var neededTotal = (listing + pFixed + itemCost + shippingCost) / den;
  var breakEvenPrice = den > 0 ? Math.max(0, (neededTotal - shipping + discount) / qty) : null;

  return {
    orderTotal: orderTotal, listing: listing, transaction: transaction, processing: processing,
    regulatory: regulatory, offsiteAds: offsiteAds, totalFees: totalFees,
    itemCost: itemCost, shippingCost: shippingCost, netProfit: netProfit, margin: margin,
    breakEvenPrice: breakEvenPrice
  };
}

if (typeof module !== 'undefined') module.exports = { computeFees: computeFees, REGIONS: REGIONS };

if (typeof document !== 'undefined') {
  (function () {
    var form = document.getElementById('calc');
    if (!form) return;
    var $ = function (id) { return document.getElementById(id); };
    var rateFields = ['listing', 'transactionPct', 'processingPct', 'processingFixed'];

    function applyRegion() {
      var r = REGIONS[$('region').value];
      rateFields.forEach(function (k) { $(k).value = r[k]; });
      document.querySelectorAll('.cur').forEach(function (el) { el.textContent = r.symbol; });
    }

    function render() {
      var sym = REGIONS[$('region').value].symbol;
      var money = function (v) { return (v < 0 ? '−' : '') + sym + Math.abs(v).toFixed(2); };
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) { if (el.id) data[el.id] = el.value; });
      var r = computeFees(data);
      ['orderTotal', 'listing', 'transaction', 'processing', 'regulatory', 'offsiteAds', 'totalFees', 'itemCost', 'shippingCost', 'netProfit']
        .forEach(function (k) { $('out-' + k).textContent = money(r[k]); });
      $('out-margin').textContent = (r.margin * 100).toFixed(1) + '%';
      $('out-breakEvenPrice').textContent = r.breakEvenPrice === null ? 'Not reachable — target margin too high' : money(r.breakEvenPrice) + ' per item';
      $('out-netProfit').parentNode.classList.toggle('neg', r.netProfit < 0);
    }

    $('region').addEventListener('change', function () { applyRegion(); render(); });
    form.addEventListener('input', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    applyRegion();
    render();
  })();
}
