/*global Miso,_,d3,document*/

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

//thanks to mbostock and trinary in #d3.js :D 
d3.selection.prototype.moveToFront = function() { 
	return this.each(function() { 
		this.parentNode.appendChild(this); 
	}); 
}; 

var allSchInfo = [];
var lastClickedIdx;

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
	var populationDarkColor = "#57AFC0";
	var frlColor = "#F18911"; 
	var frlDarkColor = "#C7710E";


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

//popBars
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
		.classed("unclicked", true)
		.on("mouseover", function (d, i) {
			mouseOverBars(i, "pop");
		})
		.on("mouseout", function (d, i) {
			mouseOutBars(i, "pop");
		})
		.on("click", function (d, i){
			clickBar(i);
		});

//frlBars
	var frlBars = svg.selectAll("rect.frlBars").data(allSchInfo);

	frlBars.enter()
		.append("rect")
		.attr({
			width : function(d){
				return barWidth((d.avgFRLTotal/100) * d.avgPopTotal);
			},
			height: singleInfoBarWidth, 
			y: function (d, i) {
				return i * (singleInfoBarWidth + barMargin);
			}, 
			fill : frlColor,
			id: function(d,i){
				return "frlBar" + i;
			}
		})
		.classed("frlBars", true)
		.classed("unclicked", true)
		.on("mouseover", function (d, i) {
			mouseOverBars(i, "frl");
		})
		.on("mouseout", function (d, i) {
			mouseOutBars(i, "frl");
		})
		.on("click", function (d, i){
			clickBar(i); 
		});

	function mouseOverBars(i, type){
		var base;
		if (type == "pop") {
			base = "popBar";
		}
		else {
			base = "frlBar";
		}

		var className = document.getElementById(base + i).className.baseVal;
		//alert(className);
		if (className == base + "s unclicked"){
			svg.selectAll("#popBar" + i)
				.attr({
					fill: populationDarkColor//populationMouseOverColor
				});
			svg.selectAll("#frlBar" + i)
				.attr({
					fill: frlDarkColor//frlMouseOverColor
				});
		}
	}

	function mouseOutBars(i, type){
		var base;
		if (type == "pop") {
			base = "popBar";
		}
		else {
			base = "frlBar";
		}

		var className = document.getElementById(base + i).className.baseVal;
		//alert(className);
		if (className == base + "s unclicked"){
			svg.selectAll("#popBar" + i)
				.attr({
					fill: populationColor
				});
			svg.selectAll("#frlBar" + i)
				.attr({
					fill: frlColor
				});
		}
	}

/*3 scenarios:
	first click 
	click bar post clicking bar
	second click bar to close bar*/
	function clickBar(i){
		//unclick previous, if exists or if it's a bar's second click
		if (lastClickedIdx !== undefined || (lastClickedIdx == i)){
			svg.selectAll(".popBarDetail").remove();
			svg.selectAll(".frlBarDetail").remove();

			svg.selectAll("#popBar" + lastClickedIdx)
				.classed("clicked", false)
				.classed("unclicked", true)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: singleInfoBarWidth,
					fill: populationColor
				});

			svg.selectAll("#frlBar" + lastClickedIdx)
				.classed("clicked", false)
				.classed("unclicked", true)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: singleInfoBarWidth,
					fill: frlColor,
					y: function(){
						if (lastClickedIdx > i){ //last click is before
							return (lastClickedIdx * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth * (numInfoPoints - 1));
						}
						else if (lastClickedIdx < i) { //last click was after
							return (lastClickedIdx * (singleInfoBarWidth + barMargin));
						}	
					}
				});
		}

		//move those that were not clicked out of the way of the expanding clicked bar
		var notClicked;


		if (lastClickedIdx == i){ //if second click, then all are not clicked
			notClicked = popBars;
		}
		else {
			notClicked = popBars.filter(
				function(dIn, iIn){
					return iIn != i;
				}
			);
		}

		notClicked.transition()
			.duration(1000)
			.ease("bounce")
			.attr({
				y: function (dy, iy) {
					if (i == lastClickedIdx){
						return iy * (singleInfoBarWidth + barMargin);
					}
					else if (iy > (i-1)){
						return iy * (singleInfoBarWidth + barMargin) + ((singleInfoBarWidth * numInfoPoints) + barMargin);
					}
					else {
						return iy * (singleInfoBarWidth + barMargin);
					}
				},
				height: singleInfoBarWidth,
				fill: populationColor
			});

		//think this has to be done like this because the indexes for the two sets of bars are the same
		//TODO I can't get it to unclick both sets at once
		if (lastClickedIdx == i){
			notClicked = frlBars;
		}
		else {
			notClicked = frlBars.filter(
				function(dIn, iIn){
					return iIn != i;
				}
			);
		}

		notClicked.transition()
			.duration(1000)
			.ease("bounce")
			.attr({
				y: function (dy, iy) {
					if (i == lastClickedIdx){
						return iy * (singleInfoBarWidth + barMargin);
					}
					else if (iy > (i-1)){
						return iy * (singleInfoBarWidth + barMargin) + ((singleInfoBarWidth * numInfoPoints) + barMargin);
					}
					else {
						return iy * (singleInfoBarWidth + barMargin);
					}
				},
				height: singleInfoBarWidth,
				fill: frlColor
			});

		//Run click logic - if bar's second click, nothing is clicked
		if (lastClickedIdx != i){
			//svg does not support z-index, go from back to front
			//darkened average population bar and widen
			svg.selectAll("#popBar" + i)
				.classed("clicked", true)
				.classed("unclicked", false)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: (singleInfoBarWidth * numInfoPoints),
					y : i * (singleInfoBarWidth + barMargin),
					fill: populationDarkColor
				});
				

			//second add detailPopBars
			svg.append("rect")
				.classed("popBarDetail", true)
				.attr({
					height: singleInfoBarWidth, 
					y: i * (singleInfoBarWidth + barMargin), 
					fill : populationColor,
					id: "detPopBar2010" + i
				})
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					width : barWidth(allSchInfo[i].pop2010Total)
				});
				
			svg.append("rect")
				.classed("popBarDetail", true)
				.attr({
					height: singleInfoBarWidth, 
					y: i * (singleInfoBarWidth + barMargin) + singleInfoBarWidth, 
					fill : populationColor,
					id: "detPopBar2011" + i
				})
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					width : barWidth(allSchInfo[i].pop2011Total)
				});

			svg.append("rect")
				.classed("popBarDetail", true)
				.attr({
					height: singleInfoBarWidth, 
					y: i * (singleInfoBarWidth + barMargin) + (singleInfoBarWidth * 2), 
					fill : populationColor,
					id: "detPopBar2012" + i
				})
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					width : barWidth(allSchInfo[i].pop2012Total)
				});

			//third, move the frlBar for the clicked bar to the front, then widen and darken
			svg.selectAll("#frlBar" + i).moveToFront();
	
			svg.selectAll("#frlBar" + i)
				.classed("clicked", true)
				.classed("unclicked", false)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: (singleInfoBarWidth * numInfoPoints),
					y : i * (singleInfoBarWidth + barMargin),
					fill: frlDarkColor
				});

			//fourth, detailed frl
			svg.append("rect")
				.classed("frlBarDetail", true)
				.attr({
					height: singleInfoBarWidth, 
					y: i * (singleInfoBarWidth + barMargin), 
					fill : frlColor,
					id: "detFrlBar2010" + i
				})
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					width : barWidth((allSchInfo[i].frlPercent2010/100) * allSchInfo[i].pop2010Total)
				});
				
			svg.append("rect")
				.classed("frlBarDetail", true)
				.attr({
					height: singleInfoBarWidth, 
					y: i * (singleInfoBarWidth + barMargin) + singleInfoBarWidth, 
					fill : frlColor,
					id: "detFrlBar2011" + i
				})
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					width : barWidth((allSchInfo[i].frlPercent2011/100) * allSchInfo[i].pop2011Total)
				});

			svg.append("rect")
				.classed("frlBarDetail", true)
				.attr({
					height: singleInfoBarWidth, 
					y: i * (singleInfoBarWidth + barMargin) + (singleInfoBarWidth * 2), 
					fill : frlColor,
					id: "detFrlBar2012" + i
				})
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					width : barWidth((allSchInfo[i].frlPercent2012/100) * allSchInfo[i].pop2012Total)
				});
		
			lastClickedIdx = i;
		}
		else { //if you reclicked the previous click, clear the last clicked index like the page is new
			lastClickedIdx = undefined;
		}
		
	}
}