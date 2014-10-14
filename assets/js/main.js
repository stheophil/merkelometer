"use strict";

require.config({
    baseUrl: "./assets/js",
    shim: {
        'highcharts': {
            deps: ['jquery']
        }
    }
});

require(["jquery", "marked", "mustache", "text!highscoreTemplate.html", "highcharts"], function($, marked, mustache, highscoreTemplate) {
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

	var deferredStmts = $.ajax({url: 'http://www.wahlversprechen2013.de/json/items/Koalitionsvertrag'});
	var deferredCategories = $.ajax({url: 'http://www.wahlversprechen2013.de/json/categories'});
	$.when(deferredStmts, deferredCategories).done(
		function(stmtsResult, categoriesResult) {
			var stmts = stmtsResult[0];
			var categories = categoriesResult[0];

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

			function setupHighscoreList() {
				$.ajax({url: 'https://api.myjson.com/bins/4g8e1'}).done( 
					function(response) {
						var element = $("#highscore");
						var filteredNames = ["scripteddemocracy", "wahlversprechen2013", "sebastian_wahlversprechen", "wanja_seifert", "wanjaseifert"];
						
						var commenters = response.response.filter(function(user) {
							return filteredNames.indexOf(user.username)===-1;
						});

						$(mustache.render(
							highscoreTemplate, 
							{
								commenters: commenters.map(function(c, i) {
									if(i < 10) {
										c.glyph = "<sup><span class='glyphicon glyphicon-star' style='color: gold'/></sup>";
									} else if(i < 20) {
										c.glyph = "<sup><span class='glyphicon glyphicon-star' style='color: silver'/></sup>";
									}
									return c;
								})
							}
						)).appendTo(element);
					});
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
						$(window).resize();
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
					var visible = tabcontent.children(id);
					visible.show();
					$(window).resize();
				});
			}

			function setupCharts() {
				var ratings = [
					{ value: "PromiseKept", id: 0, name: "Gehalten", glyph: "glyphicon-thumbs-up", color: "#5cb85c" },
					{ value: "Compromise", id: 1, name: "Kompromiss", glyph: "glyphicon-adjust", color: "#f0ad4e"  }, 
					{ value: "PromiseBroken", id: 2, name: "Gebrochen", glyph: "glyphicon-thumbs-down", color: "#d9534f" }, 
					{ value: "Stalled", id: 3, name: "Blockiert", glyph: "glyphicon-time", color: "#d9984f"  },
					{ value: "InTheWorks", id: 4, name: "In Arbeit", glyph: "glyphicon-cog", color: "#5bc0de"  },
					{ value: "Unrated", id: 5, name: "Unbewertet", glyph: "glyphicon-question-sign", color: "#aaaaaa"  }
				];
				var idxUndefined = "Unrated";

				var ratingZero = {};
				ratings.forEach(function(r) {
					ratingZero[r.value] = 0;
				});

				// map rating.value -> int	
				var ratingCounts = $.extend(true, {}, ratingZero);

				// map category.name -> rating.value -> int
				var ratingCountsPerCategory = {};

				// changes in total ratings with date
				var ratingDiff = [];
		
				stmts.forEach( function(stmt) {
					if(ratingCountsPerCategory[stmt.category]===undefined) {
						ratingCountsPerCategory[stmt.category] = $.extend(true, {}, ratingZero);
					}

					var rating = stmt.ratings.length===0 ? idxUndefined : stmt.ratings[stmt.ratings.length-1].rating
					if(ratingCounts[rating]===undefined) {
						ratingCounts[rating] = 1;
					} else {
						ratingCounts[rating]++;
					}

					var ratingPerCategory = ratingCountsPerCategory[stmt.category];

					if(ratingPerCategory[rating]===undefined) {
						ratingPerCategory[rating] = 1;
					} else {
						ratingPerCategory[rating]++;
					}

					for(var i=0; i<stmt.ratings.length; i++) {
						var prev = i===0 ? idxUndefined : stmt.ratings[i-1];
						var current = stmt.ratings[i].rating;
						if(prev!==current) {
							var date = new Date(stmt.ratings[i].date);
							ratingDiff.push( {
								prev: i===0 ? idxUndefined : stmt.ratings[i-1],
								current: stmt.ratings[i].rating,
								date: new Date(date.getFullYear(), date.getMonth(), date.getDay())
							} );	
						}
					}
				});

				ratingDiff.sort(function(lhs, rhs) {
					if(lhs.date < rhs.date) return -1;
					if(rhs.date < lhs.date) return 1;
					return 0;
				});

				var initialRatings = $.extend(true, {}, ratingZero);
				initialRatings[idxUndefined] = stmts.length;
				initialRatings.date = ratingDiff[0].date;

				var ratingsOverTime = [ initialRatings ];
				for(var i=0; i<ratingDiff.length; i++) {
					var ratingLast = ratingsOverTime[ratingsOverTime.length-1];

					var ratingNew;
					if(ratingLast.date.getTime() !== ratingDiff[i].date.getTime()) {
						ratingNew = $.extend(true, {}, ratingLast);
						ratingsOverTime.push(ratingNew);
					} else {
						ratingNew = ratingLast; // overwrite
					}
					ratingNew.date = ratingDiff[i].date;
					ratingNew[ratingDiff[i].prev]--;
					ratingNew[ratingDiff[i].current]++;
				}

				var style = {
					fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif', // default font
					fontSize: '14px',
					fontWeight: 'bold'
				};

				var categoriesFiltered = categories.filter( function(c) {
					return ratingCountsPerCategory[c.name] != undefined;
				});
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
				        				return "<a href='http://www.wahlversprechen2013.de/rating/"+p.id+"' target='_blank' class='chart'><span style='color: "+p.color + "'>"+ this.y +"</span></a>";
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
				            		return "<a href='http://www.wahlversprechen2013.de/rating/"+rating.id+"' target='_blank' class='chart'><span style='color: "+rating.color + "'><span class='glyphicon " + rating.glyph + "'></span>&nbsp;"+rating.name+"</span></a>";
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
				        				id: r.id,
				        				y: ratingCounts[r.value]
				        			};
				        	})
				        }],
				        legend: { 
				        	enabled: false
				        }
				    });
				}
				{
					$('#ressort').highcharts({
				        chart: {
				            type: 'bar',
				            style: style,
			                events: {
			                  load: function() {
			                    $(window).resize();
			                  }
			                }
				        },
				        plotOptions: {
				        	bar: {
				        		stacking: "normal"
				        	}
				        },
				        colors: ratings.map(function(r) { return r.color; }),
				        title: {
				            text: 'Bewertung der Wahlversprechen nach Ressorts'
				        },
				        xAxis: {
				            categories: categoriesFiltered.map(function(c) { return c.name; }),
				            labels: {
				            	formatter: function() {
				            		var category = this.value;
				            		return "<a href='http://www.wahlversprechen2013.de/category/"+category+"' target='_blank' class='chart'>"+category+"</a>";
				            	},
				            	useHTML: true,
				            	style: {
									textAlign: 'right'									
								}
				            }
				        },
				        yAxis: {
				            title: {
				                text: 'Anzahl der Wahlversprechen'
				            },
				            gridLineColor: null
				        },
				        series: ratings.map(function(r) { 
				        	return {
				        		name: r.name,
				        		data: categoriesFiltered.map( function(c) {
				        				return ratingCountsPerCategory[c.name][r.value];
				        			})
				        		}; 
				        	}),
				        legend: { 
				        	enabled: false
				        }
				    });
				}
				{
					var series = ratings.map(function(r) { 
				        	return {
				        		name: r.name,
				        		data: ratingsOverTime.map( function(t) {
				        			return [t.date.getTime(), t[r.value]];
				        		})
				        	}; 
				        });
					$('#zeit').highcharts({
				        chart: {
				            type: 'area',
				            style: style,
			                events: {
			                  load: function() {
			                    $(window).resize();
			                  }
			                }
				        },
				        plotOptions: {
				        	area: {
				        		stacking: "normal"
							},
				            series: {
				                marker: {
				                    enabled: false
				                }
				            }
				        },
				        colors: ratings.map(function(r) { return r.color; }),
				        title: {
				            text: 'Bewertung der Wahlversprechen über die Zeit'
				        },
				        xAxis: {
            				type: 'datetime'
            			},
				        yAxis: {
				        	title: "Anzahl",
				            gridLineColor: null
				        },
				        series: ratings.map(function(r) { 
				        	var visible = true;
				        	if(r.value === idxUndefined) {
				        		visible = false;
				        	}
				        	return {
				        		name: r.name,
				        		data: ratingsOverTime.map( function(t) {
				        			return [t.date.getTime(), t[r.value]];
				        		}),
				        		visible: visible
				        	}; 
				        }),
				        legend: { 
				        	enabled: true
				        }
				    });
				}
			}

			$(document).ready(function() {
				setupButtonHandler();
				setupHighscoreList();
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