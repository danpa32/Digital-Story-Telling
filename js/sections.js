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
  const colors = {
    hover: '#42DCA3',
    normal: 'white',
  };

  // SVG object
  const map = d3.select('#map').append('svg');

  // Projection to calculate position on map
  const projection = d3.geoOrthographic();
  projection.precision(1);

  // Function to project path to map
  const path = d3.geoPath()
    .pointRadius(10)
    .projection(projection);

  const graticule = d3.geoGraticule();

  /**
   * Rotate the projection (with transition) to center on the coordinates given by the parameter.
   * @param {Array.number} p The coordinates as longitude and latitude.
   */
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

  /**
   * Translate the projection (with transition) by the coordinates given by the parameter.
   * @param {Array.number} p The coordinates as pixels.
   */
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

  /**
   * Scale the projection (with transition) to the value given by the parameter.
   * @param {number} p The scale value.
   */
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
   * Calculate the translation based on the relative position.
   * @param {Array.number} position The relative position.
   */
  function relative(position) {
    return [position[0] * width, position[1] * height];
  }

  /**
   * Default option for the map projection for each sections.
   */
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

  /**
   * Update the map projection to correspond to the given option.
   * @param {Object} option The option of the projection.
   * @param {Array.number} option.position The relative position in the window.
   * @param {Array.number} option.rotate The coordinate on which to center.
   * @param {number} option.scale The scale of the projection.
   */
  function update(option) {
    if (world === undefined) return;

    translateTransition(relative(option.position));
    rotateTransition(option.rotate);
    scaleTransition(option.scale);
  }

  /**
   * Fit the projection to the window (when it's size changes).
   */
  function fit() {
    if (world === undefined) return;

    width = window.innerWidth;
    height = window.innerHeight;

    map.attr('width', width)
      .attr('height', height);

    update(options[optionIndex]);
  }

  /**
   * Init the map projection and the scrolling sections.
   */
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

        // Draw the graticule
        map.append('path')
          .datum(graticule)
          .attr('class', 'graticule')
          .attr('d', path);

        // Draw the world map
        map.insert('path', '.graticule')
          .datum(topojson.feature(world, world.objects.land))
          .attr('class', 'land')
          .attr('d', path);

        map.insert('path', '.graticule')
          .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
          .attr('class', 'boundary')
          .attr('d', path);

        // Function to display information above an object.
        const tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(d => `<span class="tipInfo">${d.info}</span>`);

        map.call(tip); // Set the context for the tip

        crashes.forEach((crash) => {
          crash.vols.forEach((vol) => {
            // Topojson info to display the flight's routes.
            const flightRoutes = {
              type: 'LineString',
              coordinates: [
                [vol.departure.longitude, vol.departure.latitude],
                [vol.destination.longitude, vol.destination.latitude],
              ],
              info: vol.nom,
            };

            // Draw the flight's routes.
            map.insert('path', '.graticule')
              .datum(flightRoutes)
              .attr('class', 'flightpaths')
              .attr('d', path)
              .on('mouseover', function hoverIn(d) {
                const c = d3.select(this);
                c.transition().duration(250).style('stroke', colors.hover);
                tip.show(d);
              })
              .on('mouseout', function hoverOut(d) {
                const c = d3.select(this);
                c.transition().duration(250).style('stroke', colors.normal);
                tip.hide(d);
              });
          });

          // Topojson info to display the crash location.
          const crashPoint = {
            type: 'Point',
            coordinates: [crash.coord.longitude, crash.coord.latitude],
            info: crash.coord.nom,
          };

          // Draw the crash location.
          map.insert('path', '.graticule')
            .datum(crashPoint)
            .attr('class', 'placeCrash')
            .attr('d', path)
            .on('mouseover', function hoverIn(d) {
              const c = d3.select(this);
              c.transition().duration(250).style('fill', colors.hover);
              tip.show(d);
            })
            .on('mouseout', function hoverOut(d) {
              const c = d3.select(this);
              c.transition().duration(250).style('fill', colors.normal);
              tip.hide(d);
            });
        });

        // Set the scrollable sections
        const sections = d3.select('#sections');
        const scrollable = sections.selectAll('section');
        scroll.container(sections);
        scroll(scrollable);

        // Setup event handling
        scroll.on('active', (index) => {
          optionIndex = index;

          // Highlight current step text
          scrollable.transition().style('opacity', (d, i) => ((i === index) ? 1 : 0.1));

          update(options[index]);
        });
      });
  }

  d3.select(window)
    .on('load', init)
    .on('resize', fit);
}
