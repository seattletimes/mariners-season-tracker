// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");

var data = window.seasons;
var years = Object.keys(data).sort().reverse();

var rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a || 1})`;

var palette = {
  1995: rgba(7, 119, 179, .5),
  2001: rgba(192, 33, 138, .5),
  2010: rgba(121, 143, 113, .5),
  2015: rgba(123, 90, 166, .5),
  2016: rgba(188, 92, 35)
};
var padding = 2;

var container = document.querySelector(".canvas-container");
var keyBlock = document.querySelector(".key");
var canvas = document.querySelector(".canvas-container canvas");
var context = canvas.getContext("2d");
var longest = 0;
var highest = 0;
for (var key in data) {
  if (data[key].length > longest) longest = data[key].length;
  var last = data[key][data[key].length - 1];
  if (last.wins > highest) highest = last.wins;
}
longest -= 1;

//once we have bounds, create the notes
for (var y in data) {
  var season = data[y];
  season.forEach(function(item, game) {
    if (!item.notes) return;
    var dot = document.createElement("div");
    dot.className = "note-dot";
    dot.innerHTML = `<div class="note"> ${item.notes} </div>`
    var x = (game / longest) * 100;
    dot.style.left = x + "%";
    var y = (item.wins / highest) * 100;
    if (x >= 50) dot.classList.add("right");
    dot.style.top = 100 - y + "%";
    container.appendChild(dot);
  });
  var key = document.createElement("li");
  key.innerHTML = `<i class="dot" style="background: ${palette[y]}"></i> ${y}`;
  keyBlock.appendChild(key);
}

var render = function() {
  var bounds = canvas.getBoundingClientRect();
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  var w = canvas.width - padding * 2;
  var h = canvas.height - padding * 2;
  //draw x lines
  context.lineWidth = 1;
  context.strokeStyle = rgba(0, 0, 0, .2);
  for (var i = 0; i < longest; i += 20) {
    var x = padding + (i / longest) * w
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (var key in data) {
    var season = data[key];
    context.lineWidth = key == 2016 ? 2 : 1;
    context.beginPath();
    context.moveTo(0, canvas.height);
    for (var i = 0; i < season.length; i++) {
      if (!season[i].won) break;
      var x = padding + (i / longest) * w;
      var y = h + padding - (season[i].wins / highest) * h;
      context.lineTo(x, y);
    }
    context.strokeStyle = palette[key];
    context.stroke();
  }
};

var tooltip = document.querySelector(".canvas-container .tooltip");
var highlight = function(e) {
  render();
  var bounds = canvas.getBoundingClientRect();
  var x = (e.touches ? e.touches[0].clientX : e.clientX) - bounds.left;
  var y = (e.touches ? e.touches[0].clientY : e.clientY) - bounds.top;
  var game = Math.floor(x / (canvas.width - padding * 2) * longest);
  context.beginPath();
  context.strokeStyle = rgba(0, 0, 0, .3);
  context.lineWidth = canvas.width / longest;
  var projectedX = padding + (game / longest) * (canvas.width - padding * 2)
  context.moveTo(projectedX, padding);
  context.lineTo(projectedX, canvas.height - padding);
  context.stroke();
  var html = years.filter(y => data[y][game]).map(y => `<li> <b>${y}</b>: ${data[y][game].wins}-${data[y][game].losses}`).join("\n");
  tooltip.innerHTML = `<h3>Game ${game + 1}</h3> <ul>` + html + "</ul>";
  tooltip.classList.add("show");
  tooltip.style.left = (x > canvas.width / 2 ? x - tooltip.offsetWidth : x) + "px";
  tooltip.style.top = y + 10 + "px";
};

render();

canvas.addEventListener("mousemove", highlight, 50);
canvas.addEventListener("touchmove", highlight);
window.addEventListener("resize", render);
canvas.addEventListener("mouseleave", function() {
  tooltip.classList.remove("show");
  render();
});