{
  const { d3, topojson } = window;
  let world;

  let width;
  let height;

  const translateLock = {};
  const rotateLock = {};
  const scaleLock = {};

  const transitionDuration = 3000;

  const map = d3.select('#map').append('svg');
  const projection = d3.geoOrthographic();
  projection.precision(100);
  const path = d3.geoPath()
    .projection(projection);
  const graticule = d3.geoGraticule();

  function rotate(p) {
    d3.select(rotateLock).transition()
      .duration(transitionDuration)
      .tween('rotate', () => {
        const r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
        return (t) => {
          projection.rotate(r(t));
          map.selectAll('path').attr('d', path);
        };
      });
  }

  function translate(p) {
    d3.select(translateLock).transition()
      .duration(transitionDuration)
      .tween('translate', () => {
        const r = d3.interpolate(projection.translate(), [p[0], p[1]]);
        return (t) => {
          projection.translate(r(t));
          map.selectAll('path').attr('d', path);
        };
      });
  }

  function scale(p) {
    d3.select(scaleLock).transition()
      .duration(transitionDuration)
      .tween('scale', () => {
        const r = d3.interpolate(projection.scale(), p);
        return (t) => {
          projection.scale(r(t));
          map.selectAll('path').attr('d', path);
        };
      });
  }

  const options = [
    () => {
      translate([width / 2, height / 2]);
      rotate([0, 0]);
      scale(300);
    },
    () => {
      translate([width / 4, height / 2]);
      rotate([46, 46]);
      scale(600);
    },
    () => {
      translate([width / 2, height / 2]);
      rotate([-42, 120]);
      scale(300);
    },
  ];
  let optionIndex = 0;

  function fit() {
    if (world === undefined) return;

    width = window.innerWidth;
    height = window.innerHeight;

    map.attr('width', width)
      .attr('height', height);

    // projection.translate([width / 2, height / 2]);

    options[optionIndex]();
  }

  function init() {
    d3.json('/resources/world-110m.json', (error, worldData) => {
      if (error) throw error;
      world = worldData;

      fit();

      map.append('path')
        .datum(graticule)
        .attr('class', 'graticule')
        .attr('d', path);

      map.insert('path', '.graticule')
        .datum(topojson.feature(world, world.objects.land))
        .attr('class', 'land')
        .attr('d', path);

      map.insert('path', '.graticule')
        .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
        .attr('class', 'boundary')
        .attr('d', path);

      options[optionIndex]();
    });
  }

  function update(option) {
    if (world === undefined) return;
    option();
  }

  // When the window has finished loading create our google map below
  // google.maps.event.addDomListener(window, 'resize', () => {
  //   map.setCenter(new google.maps.LatLng(40.6700, -73.9400));
  // });
  d3.select(window).on('load', init);
  window.addEventListener('resize', fit);


  const scrollable = d3.selectAll('section');
  const scroll = window.scroller();
  const sections = d3.select('#sections');
  scroll.container(sections);
  scroll(scrollable);

  // setup event handling
  scroll.on('active', (index) => {
    optionIndex = index;

    // highlight current step text
    scrollable.style('opacity', (d, i) => (i === index) ? 1 : 0.1);

    update(options[index]);

    // activate current section
    // plot.activate(index);
  });

  scroll.on('progress', (index, progress) => {
    // plot.update(index, progress);
  });
}
