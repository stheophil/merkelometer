"use strict";

require.config({
    baseUrl: "./assets/js",
    shim: {
        'highcharts': {
            deps: ['jquery']
        }
    }
});

require(["jquery", "marked", "highcharts"], function($, marked) {
/*
	function layout() {
		console.log( "window: " + $( window ).width() + " x " + $( window ).height());
		$('#intro').css(
			'min-height',
			$(window).height()
		);
		$('#filler').height(
			Math.max(0,	$(window).height() - $('#chart').height())
		);
	}
	$(document).ready(layout);
	$(window).resize(layout);
*/

	$.ajax({url: 'http://www.wahlversprechen2013.de/json/items/Koalitionsvertrag'}).done(
		function(stmts) {	
		    function display(index) {
		    	var stmt = stmts[index];
				console.log("Display quote " + stmt);
				var title = $('#entry-title');
				var quote = $('#entry-quote');
				var quote_src = $('#entry-source');

				title.text(stmt.title);
				quote.html(marked(stmt.quote));
				quote_src.html(marked(stmt.quote_src));

	            DISQUS.reset({
	                reload: true,
	                config: function () {
	                    this.page.identifier = stmt.id;
	                    this.page.url = 'http://www.wahlversprechen2013.de/item/' + stmt.id;
	                    this.page.title = stmt.title;
	                    this.language = 'de';
	                }
	            });
			}

			function reload() {
				var index = Math.ceil( Math.random() * stmts.length );
				window.location.hash = index;
				display(index);
			}

			function doRouting() {
				var arg = window.location.hash;
				var regex = /#([0-9]+)/ig;
				var r = regex.exec(arg);
				if(r===null) {
					reload();
				} else {
					display(r[1]);
				}
			}

			function setupButtonHandler() {
				$('a[href^=#]').on('click', function(e){
				    var href = $(this).attr('href');
				    if(href!="#") {		    	
					    $('html, body').animate({
					        scrollTop:$(href).offset().top
					    },'slow');
					    e.preventDefault();	
				    }
				});

				$('#reload').on('click', function(e){
				    reload();
				    e.preventDefault();
				});
			}

			function setupTabs() {
				$('[data-toggle=tab]').each(function(){
					var element = $(this);
					var id = element.attr("href");
					var tab = $(id);
					if(element.hasClass("active")) {
						tab.show();
					} else {
						tab.hide();
					}
				});
				$('[data-toggle=tab]').on('click', function(e){
					var element = $(this);
					var id = element.attr("href");
					var tab = $(id);
					
					var buttons = element.parents(".btn-group");
					buttons.children("[href='"+id+"']").addClass("active");
					buttons.children("[href!='"+id+"']").removeClass("active");

					var tabcontent = tab.parents(".tab-content");

					tabcontent.children("[id!='"+id.substr(1)+"']").hide();
					tabcontent.children(id).show();
				});
			}

			function setupCharts() {

				var ratings = [
					{ value: "PromiseKept", name: "Gehalten", glyph: "glyphicon-thumbs-up", color: "#5cb85c" },
					{ value: "Compromise", name: "Kompromiss", glyph: "glyphicon-adjust", color: "#f0ad4e"  }, 
					{ value: "PromiseBroken", name: "Gebrochen", glyph: "glyphicon-thumbs-down", color: "#d9534f" }, 
					{ value: "Stalled", name: "Blockiert", glyph: "glyphicon-time", color: "#d9984f"  },
					{ value: "InTheWorks", name: "In Arbeit", glyph: "glyphicon-cog", color: "#5bc0de"  },
					{ value: "Unrated", name: "Unbewertet", glyph: "glyphicon-question-sign", color: "#aaaaaa"  }
				];
				var idxUndefined = "Unrated";

				var ratingCounts = {};
				ratings.forEach(function(r) {
					ratingCounts[r.value] = 0;
				});
		
				stmts.forEach( function(stmt) {
					if(stmt.ratings.length===0) {
						ratingCounts[idxUndefined]++;
					} else {
						ratingCounts[stmt.ratings[stmt.ratings.length-1].rating]++;
					}
				});
				var style = {
					fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif', // default font
					fontSize: '14px',
					fontWeight: 'bold'
				};

				{
					$('#status').highcharts({
				        chart: {
				            type: 'bar',
				            style: style
				        },
				        plotOptions: {
				        	bar: {
				        		colorByPoint: true,
				        		dataLabels: {
				        			enabled: true,
				        			formatter: function() {
				        				var p = this.point;
				        				return "<span style='color: "+p.color + "'>"+ this.y +"</span>";
				        			},
				        			useHTML: true,
				        			style: style
				        		}
				        	}
				        },
				        colors: ratings.map(function(r) { return r.color; }),
				        title: {
				            text: 'Wahlversprechen nach aktueller Bewertung'
				        },
				        xAxis: {
				            categories: ratings.map(function(r) { return r; }),
				            labels: {
				            	formatter: function() {
				            		var rating = this.value;
				            		return "<span style='color: "+rating.color + "'><span class='glyphicon " + rating.glyph + "'></span>&nbsp;"+rating.name+"</span>";
				            	},
				            	useHTML: true,
				            	style: style
				            }
				        },
				        yAxis: {
				            title: {
				                text: 'Anzahl der Wahlversprechen'
				            },
				            gridLineColor: null
				        },
				        series: [{
				        	name: "Anzahl",
				        	data: ratings.map(function(r) { 
				        		return {
				        				name: r.name,
				        				color: r.color,
				        				y: ratingCounts[r.value]
				        			};
				        	})
				        }],
				        legend: { 
				        	enabled: false
				        }
				    });
				}
			}

			$(document).ready(function() {
				setupButtonHandler();
				setupTabs();
				setupCharts();

				$.ajax({
			         type: "GET",
			         url: "http://wahlversprechen2013.disqus.com/embed.js",
			         dataType: "script",
			         cache: true
			    }).done(function() {
					doRouting();

					$(window).on("hashchange", doRouting);
			    });
			});
		}
	)
});