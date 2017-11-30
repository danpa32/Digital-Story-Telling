{
  const { d3, topojson } = window;
  const scroll = window.scroller();
  let world;
  let crashes;

  let width;
  let height;

  const translateLock = {};
  const rotateLock = {};
  const scaleLock = {};

  const transitionDuration = 3000;

  const map = d3.select('#map').append('svg');
  const projection = d3.geoOrthographic();
  projection.precision(1);
  const path = d3.geoPath()
    .pointRadius(10)
    .projection(projection);
  const graticule = d3.geoGraticule();

  const plane = map.append('path')
    .attr('class', 'plane')
    .attr('d', 'm25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z');


  function rotateTransition(p) {
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

  function translateTransition(p) {
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

  function scaleTransition(p) {
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

  /**
   * calculate the translation based on the relative position.
   */
  function relative(option) {
    return [option.position[0] * width, option.position[1] * height];
  }

  const options = [
    {
      position: [0.75, 0.5],
      rotate: [0, 0],
      scale: 600,
    },
    {
      position: [0.75, 0.5],
      rotate: [46, 46],
      scale: 1200,
    },
    {
      position: [0.75, 0.5],
      rotate: [-42, 120],
      scale: 900,
    },
  ];
  let optionIndex = 0;

  function update(option) {
    if (world === undefined) return;

    translateTransition(relative(option));
    rotateTransition(option.rotate);
    scaleTransition(option.scale);
  }

  function fit() {
    if (world === undefined) return;

    width = window.innerWidth;
    height = window.innerHeight;

    map.attr('width', width)
      .attr('height', height);

    const o = options[optionIndex];
    projection.translate(relative(o));
    projection.rotate(o.rotate.map(p => -p));
    projection.scale(o.scale);
  }

  function init() {
    d3.queue()
      .defer(d3.json, '/resources/world-110m.json')
      .defer(d3.json, '/resources/crash_data.json')
      .await((error, worldData, crashesData) => {
        if (error) throw error;
        world = worldData;
        crashes = crashesData;

        crashes.forEach((crash, i) => {
          options[i].rotate = [crash.coord.longitude, crash.coord.latitude];
        });

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

        crashes.forEach((crash) => {
          const crashText = d3.select('#sections')
            .append('section')
            .classed('content-section text-justify', true)
            .append('div')
            .classed('container', true)
            .append('div')
            .classed('row', true)
            .append('div')
            .classed('col-lg-8 mx-auto', true);
          crashText
            .append('h2')
            .classed('text-center', true)
            .html(crash.nom);

          crash.info.forEach((p) => {
            crashText
              .append('p')
              .html(p);
          });

          const sections = d3.select('#sections');
          const scrollable = sections.selectAll('section');
          scroll.container(sections);
          scroll(scrollable);

          // setup event handling
          scroll.on('active', (index) => {
            optionIndex = index;

            // highlight current step text
            scrollable.transition().style('opacity', (d, i) => ((i === index) ? 1 : 0.1));

            update(options[index]);

            // activate current section
            // plot.activate(index);
          });

          scroll.on('progress', (index, progress) => {
            // plot.update(index, progress);
          });

          const tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(d => `<span class="tipInfo">${d.info}</span>`);

          map.call(tip);

          crash.vols.forEach((vol) => {
            const flightRoutes = {
              type: 'LineString',
              coordinates: [
                [vol.departure.longitude, vol.departure.latitude],
                [vol.destination.longitude, vol.destination.latitude],
              ],
              info: vol.nom,
            };

            map.insert('path', '.graticule')
              .datum(flightRoutes)
              .attr('class', 'flightpaths')
              .attr('d', path)
              .on('mouseover', function hover(d) {
                const c = d3.select(this);
                c.transition().duration(250).style('stroke', '#42DCA3');
                tip.show(d);
              })
              .on('mouseout', function hover(d) {
                const c = d3.select(this);
                c.transition().duration(250).style('stroke', 'white');
                tip.hide(d);
              });
          });

          const crashPoint = {
            type: 'Point',
            coordinates: [crash.coord.longitude, crash.coord.latitude],
            info: crash.coord.nom,
          };

          // const circle = d3.geoCircle()
          //   .center([crash.coord.longitude, crash.coord.latitude])
          //   .radius(1);
          map.insert('path', '.graticule')
            .datum(crashPoint)
            .attr('class', 'placeCrash')
            .attr('d', path)
            .on('mouseover', function hover(d) {
              const c = d3.select(this);
              c.transition().duration(250).style('fill', '#42DCA3');
              tip.show(d);
            })
            .on('mouseout', function hover(d) {
              const c = d3.select(this);
              c.transition().duration(250).style('fill', 'white');
              tip.hide(d);
            });
        });
      });
  }

  // When the window has finished loading create our google map below
  // google.maps.event.addDomListener(window, 'resize', () => {
  //   map.setCenter(new google.maps.LatLng(40.6700, -73.9400));
  // });
  d3.select(window).on('load', init);
  window.addEventListener('resize', fit);
}
