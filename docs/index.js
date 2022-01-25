
'use strict';

(function () {

	// Inputs.
	var income = 0;
	// var isos = 0;
	var strike = 0;
	var fmv = 0;
	var filingStatus = 'single';
	var maxISOs = 0;

	// Outputs
	var bargainElement = 0;
	var amti = 0;
	var amtexemption = 0;
	var amtbase = 0;
	var amt = 0;
	var ordinaryTax = 0;
	var payableTax = 0;

	// Constants for 2022.
	var exemption = {
		'single': {
			amount: 75900,
			phaseout: 539900,
			break: 206100
		},
		'married': {
			amount: 118400,
			phaseout: 1079800,
			break: 206100
		},
		'mfs': {
			amount: 59050,
			phaseout: 539900,
			break: 103050
		}
	};
	var ordinaryTaxRates = {
		'single': [
			[10, 0],
			[12, 10275],
			[22, 41775],
			[24, 89075],
			[32, 170050],
			[35, 215950],
			[37, 539900],
			[0, 999999999]
		],
		'married': [
			[10, 0],
			[12, 20550],
			[22, 83550],
			[24, 178150],
			[32, 340100],
			[35, 431900],
			[37, 647850],
			[0, 999999999]
		],
		'mfs': [
			[10, 0],
			[12, 10275],
			[22, 41775],
			[24, 89075],
			[32, 170050],
			[35, 215950],
			[37, 323925],
			[0, 999999999]
		],
	}
	var standardDeduction = {
		'single': 12950,
		'married': 25900,
		'mfs': 19400
	}


	// Calculate bargain element.
	// (fmv - strike price) * ISOs exercised
	// We pass `isos` into the function to allow for newton's method
	function calculateBargainElement(isos) {
		return (num(fmv) - num(strike)) * num(isos);
	}

	// Calculate amt exemption.
	function calculateAmtExemption(amti) {
		var ex = exemption[filingStatus];
		var amount = ex.amount;
		var deduct = 0;
		if (num(amti) > ex.phaseout) deduct += (num(amti) - ex.phaseout) * 0.25;
		amount -= deduct;
		if (amount > 0) return amount;
		return 0;
	}

	// Calculate amt.
	function calculateAmt(amtbase) {
		var ex = exemption[filingStatus];
		if (num(amtbase) > ex.break) return ex.break * 0.26 + (num(amtbase) - ex.break) * 0.28;
		if (isNaN(amtbase)) amtbase = 0;
		return num(amtbase) * 0.26;
	}

	// Calculate ordinary tax.
	function calculateOrdinaryTax() {
		var grossIncome = num(income);
		var taxRates = ordinaryTaxRates[filingStatus];
		var deduction = standardDeduction[filingStatus];

		// Estimated regular taxes
		var taxableIncome = grossIncome - deduction;
		return calculateIncomeTaxLadder(taxableIncome, taxRates);
	}

	function calculateIncomeTaxLadder(taxableIncome, taxRates) {
		var incomeTax = 0;
		for (const [i, rateAndThreshold] of taxRates.entries()) {
			if (i == 0) continue;
			var previousRate = taxRates[i - 1][0] / 100.0;
			var threshold = rateAndThreshold[1];
			if (threshold < taxableIncome) {
				var previousThreshold = taxRates[i - 1][1];
				incomeTax += previousRate * (incomeTax - previousThreshold);
				break;
			} else {
				incomeTax += previousRate * threshold;
			}
		}
		return incomeTax;
	}

	// Set the filing status.
	document.querySelectorAll('a.filing-status').forEach(function (el) {
		el.addEventListener('click', function (e) {
			var arr = document.querySelectorAll('a.filing-status');
			var status = e.target.id;
			for (var i = 0; i < arr.length; i++) {
				if (arr[i].id !== status) removeClass(arr[i], 'active')
				else {
					addClass(arr[i], 'active');
					filingStatus = status;
				}
			}
			calculate();
			updateHtml();
		})
	})

	// Calculate everything.
	function calculate(isos) {
		bargainElement = calculateBargainElement(isos);
		amti = num(income) + num(bargainElement);
		amtexemption = calculateAmtExemption(num(amti));
		amtbase = num(amti) - num(amtexemption);
		amt = calculateAmt(num(amtbase));
		ordinaryTax = calculateOrdinaryTax();
		payableTax = Math.max(num(amt), num(ordinaryTax))
	}

	// Collect inputs.
	function getInputs() {
		income = document.getElementById('income').value
		strike = document.getElementById('strike').value
		// isos = document.getElementById('isos').value
		fmv = document.getElementById('fmv').value
	}

	// Format inputs.
	function formatInputs() {
		document.getElementById('income').value = document.getElementById('income').value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		document.getElementById('isos').value = document.getElementById('isos').value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		document.getElementById('strike').value = document.getElementById('strike').value.replace(/\D\./g, "");
		document.getElementById('fmv').value = document.getElementById('fmv').value.replace(/\D\./g, "");
	}

	// Send outputs to HTML elements.
	function updateHtml() {
		document.getElementById('bargainElement').innerText = numberFormat(bargainElement, ',');
		document.getElementById('amti').innerText = numberFormat(amti, ',');
		document.getElementById('amtexemption').innerText = numberFormat(amtexemption, ',');
		document.getElementById('amtbase').innerText = numberFormat(amtbase, ',');
		document.getElementById('amt').innerText = numberFormat(amt, ',');
		document.getElementById('ordinaryTax').innerText = numberFormat(ordinaryTax, ',');
		document.getElementById('income-output').innerText = document.getElementById('income').value;
		document.getElementById('payable-tax').innerText = numberFormat(payableTax, ',');
		if (amt > ordinaryTax) {
			removeClass(document.getElementById('max-isos-wrapper'), 'dn');
			document.getElementById('max-isos').innerText = numberFormat(maxISOs, ',');
		} else {
			addClass(document.getElementById('max-isos-wrapper'), 'dn');
		}
	}

	// Whenever user key ups on the form.
	document.querySelector('form').addEventListener('keyup', function (e) {
		getInputs();
		formatInputs();
		var isos = document.getElementById('isos').value;
		calculate(isos);
		maxISOs = findISOs(isos);
		updateHtml();
	})

	// Format numbers.
	function numberFormat(number, _sep) {
		var _number = number;
		_number = typeof _number != "undefined" && _number > 0 ? _number : "";
		_number = '' + Math.round(_number);
		_number = _number.replace(new RegExp("^(\\d{" + (_number.length % 3 ? _number.length % 3 : 0) + "})(\\d{3})", "g"), "$1 $2").replace(/(\d{3})+?/gi, "$1 ").trim();
		if (typeof _sep != "undefined" && _sep != " ") _number = _number.replace(/\s/g, _sep);
		return _number;
	}

	// Turn string to number.
	function num(string) {
		if (typeof string === 'undefined') return 0;
		if (typeof string === 'number') return string;
		string = string.replace(/\,/g, '');
		return parseFloat(string, 10);
	}

	/**
	 * Newtown's method to approximate ISO shares where Ordinary Tax equals AMT
	 */

	function findISOs(isos) {
		var tempMaxISOs = num(isos);
		var discrepancy = amt - ordinaryTax;

		var counter = 0;

		var upper = num(isos);
		var lower = 0;

		// Iterate until discrepancy is less than 100.
		while (Math.abs(discrepancy) > 10) {
			// Not the most intelligent routing of seeding ISOs.
			if (discrepancy > 0) {
				upper = tempMaxISOs;
				tempMaxISOs = (upper + lower) / 2;
			}
			if (discrepancy < 0) {
				lower = tempMaxISOs;
				tempMaxISOs = (upper + lower) / 2;
			}

			var bargainElement = calculateBargainElement(tempMaxISOs);
			var amti = num(income) + num(bargainElement);
			var amtexemption = calculateAmtExemption(num(amti));
			var amtbase = num(amti) - num(amtexemption);
			var newAmt = calculateAmt(num(amtbase));

			discrepancy = newAmt - ordinaryTax;

			// console.log('counter %d, discrepancy %d, isos %d', counter, discrepancy, tempMaxISOs)

			counter++;
			if (counter > 100) break;
		}

		return tempMaxISOs;
	}

	/**
	 * Add class once.
	 */

	function addClass(el, c) {
		if (el.classList.contains(c)) return;
		return el.classList.add(c);
	}

	/**
	 * Remove class once.
	 */

	function removeClass(el, c) {
		if (el.classList.contains(c)) return el.classList.remove(c);
	}

})()
