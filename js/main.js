/*global Miso,_,console,d3*/

/*
 this is not generic for now, make it generic later!
*/
Array.prototype.addNewInfo = function(newItem, newInfoCol, newColName) {
	for (var i = 0; i < this.length; i++) {
		if (this[i].schoolNum == newItem.schoolNum){
			this[i][newColName] = newItem[newInfoCol];
		}
	}
};

Array.prototype.avg = function() {
	var total = 0;
	for (var i = 0; i < this.length; i++) {
		total += this[i];
	}
	return total / this.length;
};

var allSchInfo = [];

function loadDataset () {
	var schList = new Miso.Dataset({
		url : "data/school_gps_coordinates.csv",
		delimiter : ","
	});

	//2010
	var pop2010 = new Miso.Dataset({
		url : "data/2010/2010_csv_enrl.csv",
		delimiter : ","
	});

	var frl2010 = new Miso.Dataset({
		url : "data/2010/2010_csv_frl.csv",
		delimiter : ","
	});

	//2011
	var pop2011 = new Miso.Dataset({
		url : "data/2011/2011_enrl_working.csv",
		delimiter : ","
	});

	var frl2011 = new Miso.Dataset({
		url : "data/2011/2011_k_12_FRL.csv",
		delimiter : ","
	});

	//2012
	var pop2012 = new Miso.Dataset({
		url : "data/2012/2012_enrl_working.csv",
		delimiter : ","
	}); 

	var frl2012 = new Miso.Dataset({
		url : "data/2012/2012_k_12_FRL.csv",
		delimiter : ","
	});

//first, push a list of all the schools with info
//this is all done within underscore's _.when so they will all fetch before proceeding
	_.when(
		schList.fetch({
			success : function() {
				this.each(
					function(row){
						var schInfo = {};
						schInfo.schoolNum = row['School Number'];
						schInfo.schoolName = row['School Name'];
						allSchInfo.push(schInfo);
					}
				);
			}
		}),
		
	//next, add in population/frl data by school
		pop2010.fetch({
			success : function() {
				this.each(
					function(row){
						var schInfo = {};
						schInfo.schoolNum = row['SCHOOL CODE'];
						schInfo.totalPop = row.TOTAL;

						allSchInfo.addNewInfo(schInfo, 'totalPop', 'pop2010Total');
					}
				);
			}
		}),

		frl2010.fetch({
			success : function() {
				this.each(
					function(row){
						if (row['SCHOOL NAME'] != 'STATE TOTAL' && row['% FREE AND REDUCED'] !== null){
							var schInfo = {};
							schInfo.schoolNum = row['SCHOOL CODE'];
							schInfo.frlPct = parseFloat(row['% FREE AND REDUCED'].substring(0, row['% FREE AND REDUCED'].length - 1));

							allSchInfo.addNewInfo(schInfo, 'frlPct', 'frlPercent2010');
						}
					}
				);
			}
		}),

		pop2011.fetch({
			success : function() {
				this.each(
					function(row){
						var schInfo = {};
						schInfo.schoolNum = row['School Code'];
						schInfo.totalPop = row.TOTAL;

						allSchInfo.addNewInfo(schInfo, 'totalPop', 'pop2011Total');
					}
				);
			}
		}),

		frl2011.fetch({
			success : function() {
				this.each(
					function(row){
						var schInfo = {};
						schInfo.schoolNum = row['SCHOOL CODE'];
						schInfo.frlPct = parseFloat(row['% FREE AND REDUCED'].substring(0, row['% FREE AND REDUCED'].length - 1));

						allSchInfo.addNewInfo(schInfo, 'frlPct', 'frlPercent2011');				
					}
				);
			}
		}),

		pop2012.fetch({
			success : function() {
				this.each(
					function(row){
						var schInfo = {};
						schInfo.schoolNum = row['School Code'];
						schInfo.totalPop = row.TOTAL;

						allSchInfo.addNewInfo(schInfo, 'totalPop', 'pop2012Total');
					}
				);
			}
		}),

		frl2012.fetch({
			success : function() {
				this.each(
					function(row){
						if (row['SCHOOL NAME'] != 'STATE TOTAL' && row['% FREE AND REDUCED'] !== null){
							var schInfo = {};
							schInfo.schoolNum = row['SCHOOL CODE'];

							schInfo.frlPct = parseFloat(row['% FREE AND REDUCED'].substring(0, row['% FREE AND REDUCED'].length - 1));

							allSchInfo.addNewInfo(schInfo, 'frlPct', 'frlPercent2012');
						}
					}
				);
			}
		})
	).then(
		function(){
			document.getElementById("loading").style.display = 'none';
			console.log(allSchInfo.length);
			drawPage();
		}
	);
}

function drawPage(){
	//widths
	var pageWidth = 1000;
	var singleInfoBarWidth = 20;
	var numInfoPoints = 3;
	var barMargin = 5; 

	//colors
	var populationColor = "#69D2E7";
	var populationMouseOverColor = "#5DBACD";
	var popBreakdownColor = "#A7DBD8";
	var frlColor = "#FA6900"; 
	var frlBreakdownColor = "#F38630";


	for (var i = 0; i < allSchInfo.length; i++) {
		var populations = [];
		var frlTotals = [];

		if (allSchInfo[i].pop2010Total !== undefined){
			populations.push(allSchInfo[i].pop2010Total);
		}
		if (allSchInfo[i].pop2011Total !== undefined){
			populations.push(allSchInfo[i].pop2011Total);
		}
		if (allSchInfo[i].pop2012Total !== undefined){
			populations.push(allSchInfo[i].pop2012Total);
		}

		if (allSchInfo[i].frlPercent2010 !== undefined){
			frlTotals.push(allSchInfo[i].frlPercent2010);
		}
		if (allSchInfo[i].frlPercent2011 !== undefined){
			frlTotals.push(allSchInfo[i].frlPercent2011);
		}
		if (allSchInfo[i].frlPercent2012 !== undefined){
			frlTotals.push(allSchInfo[i].frlPercent2012);
		}

		allSchInfo[i].avgPopTotal = Math.round(populations.avg());
		allSchInfo[i].avgFRLTotal = frlTotals.avg().toFixed(2);
	}

	var svg = d3.select("svg")
				.attr("width", pageWidth)
				.attr("height", allSchInfo.length * (singleInfoBarWidth + barMargin));

	var pop2010Max = d3.max(allSchInfo, function(d10) {
		return d10.pop2010Total;
	});
	var pop2011Max = d3.max(allSchInfo, function(d11) {
		return d11.pop2011Total;
	});
	var pop2012Max = d3.max(allSchInfo, function(d12) {
		return d12.pop2012Total;
	});

	var popMax = d3.max([pop2010Max, pop2011Max, pop2012Max]);

	var barWidth = d3.scale.linear()
		.domain([0, popMax])
		.range([0, pageWidth]);

	var popBars = svg.selectAll("rect.popBars").data(allSchInfo);

	popBars.enter()
		.append("rect")
		.attr({
			width : function(d){
				return barWidth(d.avgPopTotal);
			},
			height: singleInfoBarWidth, 
			y: function (d, i) {
				return i * (singleInfoBarWidth + barMargin);
			}, 
			fill : populationColor,
			id: function(d,i){
				return "popBar" + i;
			}
		})
		.classed("popBars", true)
		.classed("popBarUnclick", true)
		.on("mouseover", function (d, i) {
			svg.selectAll("#popBar" + i)
				.attr({
					fill: populationMouseOverColor
				});
		})
		.on("mouseout", function (d, i) {
			svg.selectAll("#popBar" + i)
				.attr({
					fill: populationColor
				});
		})
		.on("click", function(d, i){
			//alert("#bar" + i + ": " + d.avgFRLTotal + "% of " + d.avgPopTotal);

			var notClicked = popBars.filter(
				function(dIn, iIn){
					return iIn != i;
				}
			);

			popBars.classed("popBarUnclick", false)
			.classed("popBarClick", false)
			.classed("popBarUnclick", true);

			notClicked.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					y: function (dy, iy) {
						if (iy > (i-1)){
							return iy * (singleInfoBarWidth + barMargin) + ((singleInfoBarWidth * numInfoPoints) + barMargin);
						}
						else {
							return iy * (singleInfoBarWidth + barMargin);
						}
					},
					height: singleInfoBarWidth
				});

			svg.selectAll("#popBar" + i)
				.classed("popBarUnclick", false)
				.classed("popBarClick", true)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: (singleInfoBarWidth * numInfoPoints),
					y : i * (singleInfoBarWidth + barMargin)
				});
		});

	/*var frlBars = svg.selectAll("rect.frlBars").data(allSchInfo);

	frlBars.enter()
		.append("rect")
		.attr({
			width : function(d){
				return barWidth((d.avgFRLTotal/100) * d.avgPopTotal);
			},
			height: 20, 
			y: function (d, i) {
				return i * 25 + 20;
			}, 
			fill : "#0000ff"
		})
		.classed("frlBars", true)
		.on("click", function(){
			//alert(d.avgFRLTotal + "% of " + d.avgPopTotal);
			//hide bar
			//draw 23 bars in place with 
		});*/
}