
'use strict';

(function() {

	// Inputs.
	var income = 0;
	var isos = 0;
	var strike = 0;
	var fmv = 0;
	var filingStatus = 'single';

	// Outputs
	var bargainElement = 0;
	var amti = 0;
	var amtexemption = 0;
	var amtbase = 0;
	var amt = 0;
	var ordinaryTax = 0;
	var payableTax = 0;

	// Constants for 2016.
	var exemption = {
		'single': {
			amount: 53900,
			phaseout: 119700,
			break: 186300
		},
		'married': {
			amount: 83800,
			phaseout: 159700,
			break: 186300
		},
		'mfs': {
			amount: 41900,
			phaseout: 79850,
			break: 93150
		}
	};
	var ordinaryTaxRates = {
		'single': {
			'10': 0,
			'15': 9275,
			'25': 37650,
			'28': 91150,
			'33': 190150,
			'35': 413350,
			'39.6': 415050
		},
		'married': {
			'10': 0,
			'15': 13250,
			'25': 50400,
			'28': 130150,
			'33': 210800,
			'35': 413350,
			'39.6': 441000
		},
		'mfs': {
			'10': 0,
			'15': 9275,
			'25': 37650,
			'28': 75950,
			'33': 115725,
			'35': 206675,
			'39.6': 233475
		}
	}


	// Calculate bargain element.
	// (fmv - strike price) * ISOs exercised
	function calculateBargainElement() {
		return (num(fmv) - num(strike)) * num(isos);
	}

	// Calculate amt exemption.
	function calculateAmtExemption() {
		var ex = exemption[filingStatus];
		var amount = ex.amount
		var deduct = 0;
		if (num(income) > ex.phaseout) deduct += (num(income) - ex.phaseout) * 0.25;
		amount -= deduct;
		if (amount > 0) return amount;
		return 0;
	}

	// Calculate amt.
	function calculateAmt() {
		var ex = exemption[filingStatus];
		if (num(amtbase) > ex.break) return ex.break * 0.26 + (num(amtbase) - ex.break) * 0.28;
		if (isNaN(amtbase)) amtbase = 0;
		return num(amtbase) * 0.26;
	}

	// Calculate ordinary tax.
	function calculateOrdinaryTax() {
		var inc = num(income)
		var ord = ordinaryTaxRates[filingStatus];
		var keys = Object.keys(ord);
		var bracket = 0;
		var tax = 0;

		// Figure out which bracket we're in.
		var i = 0;
		while (inc > ord[keys[i]]) {
			i++;
		}
		i--;

		// Calculate it.
		tax += (inc - ord[keys[i]]) * num(keys[i]) / 100
		i--;
		while (i >= 0) {
			tax += ord[keys[i + 1]] * num(keys[i]) / 100
			i--;
		}

		return tax;
	}

	// Set the filing status.
	document.querySelectorAll('a.filing-status').forEach(function(el) {
		el.addEventListener('click', function(e) {
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
	function calculate() {
		bargainElement = calculateBargainElement();
		amti = num(income) + num(bargainElement);
		amtexemption = calculateAmtExemption();
		amtbase = num(amti) - num(amtexemption);
		amt = calculateAmt();
		ordinaryTax = calculateOrdinaryTax();
		payableTax = Math.max(num(amt), num(ordinaryTax))
		console.log('amt is %s and ordinary is %s', num(amt), ordinaryTax)
		console.log(payableTax, typeof payableTax)
	}

	// Collect inputs.
	function getInputs() {
		income = document.getElementById('income').value
		strike = document.getElementById('strike').value
		isos = document.getElementById('isos').value
		fmv = document.getElementById('fmv').value
	}

	// Format inputs.
	function formatInputs() {
		document.getElementById('income').value = document.getElementById('income').value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		document.getElementById('isos').value = document.getElementById('isos').value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		document.getElementById('strike').value = document.getElementById('strike').value.replace(/\D\./g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		document.getElementById('fmv').value = document.getElementById('fmv').value.replace(/\D\./g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
	}

	// Whenever user key ups on the form.
	document.querySelector('form').addEventListener('keyup', function(e) {
		getInputs();
		formatInputs();
		calculate();
		updateHtml();
	})

	// Format numbers.
	function numberFormat(number, _sep) {
		var _number = number;
	  _number = typeof _number != "undefined" && _number > 0 ? _number : "";
	  _number = '' + Math.round(_number);
	  _number = _number.replace(new RegExp("^(\\d{" + (_number.length%3? _number.length%3:0) + "})(\\d{3})", "g"), "$1 $2").replace(/(\d{3})+?/gi, "$1 ").trim();
	  if (typeof _sep != "undefined" && _sep != " ") _number = _number.replace(/\s/g, _sep);
	  return _number;
	}

	// Turn string to number.
	function num(string) {
		if (typeof string === 'undefined') return 0;
		if (typeof string === 'number') return string;
		string = string.replace(/\,/g,'');
		return parseInt(string, 10);
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