{
  const { d3, topojson } = window;

  /**
   * scroller - handles the details
   * of figuring out which section
   * the user is currently scrolled
   * to.
   *
   */
  function scroller() {
    let container = d3.select('body');
    // event dispatcher
    const dispatch = d3.dispatch('active', 'progress');

    // d3 selection of all the
    // text sections that will
    // be scrolled through
    let sections = null;

    // array that will hold the
    // y coordinate of each section
    // that is scrolled through
    let sectionPositions = [];
    let currentIndex = -1;
    // y coordinate of
    let containerStart = 0;

    /**
     * resize - called initially and
     * also when page is resized.
     * Resets the sectionPositions
     *
     */
    function resize() {
      // sectionPositions will be each sections
      // starting position relative to the top
      // of the first section.
      sectionPositions = [];
      let startPos;
      sections.each(function (d, i) {
        const { top, bottom } = this.getBoundingClientRect();
        if (i === 0) {
          startPos = top;
        }
        sectionPositions.push(bottom - startPos);
      });
      containerStart = container.node().getBoundingClientRect().top + window.pageYOffset;
    }

    /**
     * position - get current users position.
     * if user has scrolled to new section,
     * dispatch active event with new section
     * index.
     *
     */
    function position() {
      const pos = window.pageYOffset - containerStart + window.innerHeight / 2;
      let sectionIndex = d3.bisect(sectionPositions, pos);
      sectionIndex = Math.min(sections.size() - 1, sectionIndex);

      if (currentIndex !== sectionIndex) {
        // @v4 you now `.call` the dispatch callback
        dispatch.call('active', this, sectionIndex);
        currentIndex = sectionIndex;
      }

      const prevIndex = Math.max(sectionIndex - 1, 0);
      const prevTop = sectionPositions[prevIndex];
      const progress = (pos - prevTop) / (sectionPositions[sectionIndex] - prevTop);
      // @v4 you now `.call` the dispatch callback
      dispatch.call('progress', this, currentIndex, progress);
    }

    /**
     * scroll - constructor function.
     * Sets up scroller to monitor
     * scrolling of els selection.
     *
     * @param els - d3 selection of
     *  elements that will be scrolled
     *  through by user.
     */
    function scroll(els) {
      sections = els;

      // when window is scrolled call
      // position. When it is resized
      // call resize.
      d3.select(window)
        .on('scroll.scroller', position)
        .on('resize.scroller', resize);

      // manually call resize
      // initially to setup
      // scroller.
      resize();

      // hack to get position
      // to be called once for
      // the scroll position on
      // load.
      // @v4 timer no longer stops if you
      // return true at the end of the callback
      // function - so here we stop it explicitly.
      const timer = d3.timer(() => {
        position();
        timer.stop();
      });
    }

    /**
     * container - get/set the parent element
     * of the sections. Useful for if the
     * scrolling doesn't start at the very top
     * of the page.
     *
     * @param value - the new container value
     */
    scroll.container = function setContainer(value) {
      if (arguments.length === 0) {
        return container;
      }
      container = value;
      return scroll;
    };

    scroll.resize = resize;

    // @v4 There is now no d3.rebind, so this implements
    // a .on method to pass in a callback to the dispatcher.
    scroll.on = (action, callback) => {
      dispatch.on(action, callback);
    };

    return scroll;
  }
}
