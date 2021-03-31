<template>  
  <div ref="heatmapContainerEl" :class="{'calendar-heatmap-container': true}">
    <b-skeleton :animated="true" :height="height" width="100%" v-if="isLoading" />
    <svg v-show="!isLoading" class="heatmap" :class="{'debugging': debugging}" width="100%" :height="height" v-on="listeners" ref="svgEl">
      <g ref="heatmapBodyEl" class="heatmap-body" :style="{transform: `translate(${margin.left}px, ${margin.top}px)`}"></g>
    </svg>
  </div>
</template>

<script>

  // dependencies
  import * as d3 from 'd3';
  import m from 'moment';
  // import _ from 'lodash';

  // helpers
  const getElementProps = (el) => {
    const {
      'padding-left': paddingLeft,
      'padding-right': paddingRight,
    } = window.getComputedStyle(el);
    return {
      paddingLeft,
      paddingRight,
    };
  };

  // javascript datetime/d3 path helpers
  function inRange(curDate, date1, date2) {
    let startDate = null;
    let endDate = null;
    if (date1.getTime() < date2.getTime()) {
      startDate = date1;
      endDate = date2;
    } else {
      startDate = date2;
      endDate = date1;
    }
    if (curDate.getTime() <= endDate.getTime() && curDate.getTime() >= startDate.getTime()) {
      return true;
    }
    return false;
  }
  const countDay = (i) => (i + 6) % 7;
  const formatDay = (i) => 'SMTWTFS'[i];
  function pathMonth(t0, cellSize) {
    const t1 = new Date(t0.getUTCFullYear(), t0.getUTCMonth() + 1, 0);
    t1.setMinutes(t1.getMinutes() + Math.abs(t1.getTimezoneOffset()));
    const d0 = countDay(t0.getUTCDay());
    const w0 = d3.utcMonday.count(d3.utcYear(t0), t0);
    const d1 = countDay(t1.getUTCDay());
    const w1 = d3.utcMonday.count(d3.utcYear(t1), t1);
    // eslint-disable-next-line prefer-template
    return 'M' + (w0 + 1) * cellSize + ',' + d0 * cellSize
      + 'H' + w0 * cellSize + 'V' + 7 * cellSize
      + 'H' + w1 * cellSize + 'V' + (d1 + 1) * cellSize
      + 'H' + (w1 + 1) * cellSize + 'V' + 0
      + 'H' + (w0 + 1) * cellSize + 'Z';
    // NOTE: play around here to understand this better https://yqnn.github.io/svg-path-editor/
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function interpolateDate(x, y, cellSize, referenceDate) {
    // TODO: implement logic
  }

  const INITIAL_HEIGHT = 240;

  export default {
    name: 'CalendarHeatmap',
    props: {

      data: {
        type: Array,
        default: () => [],
      },
      margin: {
        type: Object,
        default: () => ({
          left: 24,
          right: 32,
          top: 16,
          bottom: 16,
        }),
      },
      cellSpacing: {
        type: Number,
        default: 3,
      },
      legend: {
        type: Array,
        default: () => [],
      },
      continuous: {
        type: Boolean,
        default: true,
      },
      isLoading: {
        type: Boolean,
        default: false,
      },
      debugging: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        height: INITIAL_HEIGHT,
        containerWidth: 0,
        rangeSelection: null,
      };
    },
    watch: {
      data() {
        this.setHeight();
        this.render();
      },
      containerWidth() {
        this.setHeight();
        this.render();
      },
    },
    methods: {
      color(value) {
        if (this.continuous && value > 0) {
          return d3.scaleSequential(d3.interpolateRgb('#24292E', '#E3551A')).domain([0, 1])(value);
        } else {
          if (this.legend.length === 0) return 'red';
          if (!value) return '#24292E';
          return this.legend.find((x) => x.value === parseInt(value, 10)).color || '#24292E';
        }
      },
      setHeight() {
        this.height = ((this.cellSize + this.cellSpacing) * 7) || INITIAL_HEIGHT;
      },
      render() {
        const that = this;

        // drawing container
        const { heatmapBodyEl } = this.$refs;

        // remove existing contents
        d3.select(heatmapBodyEl)
          .selectAll('*')
          .remove();

        if (this.data.length === 0) return;
                
        // draw week days
        d3.select(heatmapBodyEl)
          .append('g')
          .attr('text-anchor', 'end')
          .selectAll('text')
          .data(d3.range(7))
          .join('text')
          .classed('dow', true)
          .classed('noselect', true)
          .attr('x', -8)
          .attr('y', (i) => (countDay(i) + 0.5) * that.cellSize)
          .attr('dy', '0.31em')
          .text(formatDay);

        // draw rectangles
        
        d3.select(heatmapBodyEl)
          .selectAll('rect')
          .data(that.data)
          .join('rect')          
          .attr('class', 'day-rect')
          .style('fill', (d) => that.color(d.value))
          .attr('width', that.cellSize - that.cellSpacing)
          .attr('height', that.cellSize - that.cellSpacing)
          .attr('x', (d) => d3.utcMonday.count(d3.utcYear(d.date), d.date) * that.cellSize + (that.cellSpacing / 2))
          .attr('y', (d) => countDay(d.date.getUTCDay()) * that.cellSize + (that.cellSpacing / 2))
          .on('mousedown', that.mouseDown)
          .on('mousemove', that.mouseMove)
          .on('mouseup', that.mouseUp);

        // insert month containers
        const month = d3.select(heatmapBodyEl)
          .append('g')
          .selectAll('g')
          // .data(d3.utcMonths(d3.utcMonth(that.data[0].date), that.data[that.data.length - 1].date))
          .data(d3.utcMonths(d3.utcMonth(that.minDate), that.maxDate))
          .join('g');

        month.append('path')
          .attr('class', 'month-divider')
          .attr('d', (t) => pathMonth(t, that.cellSize));

        month.append('text')
          .attr('x', (d) => d3.utcMonday.count(d3.utcYear(d), d3.utcMonday.ceil(d)) * that.cellSize + 2)
          .attr('y', -8)
          .text(d3.utcFormat('%b'))
          .classed('moy', true)
          .classed('noselect', true);

      },
      registerResizeObserver() {
        const { heatmapContainerEl } = this.$refs;
        const resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver = resizeObserver;
        resizeObserver.observe(heatmapContainerEl);
      },
      onResize() {
        const { heatmapContainerEl } = this.$refs;
        const {
          paddingLeft,
          paddingRight,
        } = getElementProps(heatmapContainerEl);
        this.containerWidth = heatmapContainerEl.offsetWidth - (window.parseInt(paddingLeft) + window.parseInt(paddingRight));
      },

      // HINT: helper function
      mouseInRender(x, y) {
        // deterime mouse within svg render range
        return x > this.margin.left
          && x < (this.containerWidth - this.margin.right)
          && y > this.margin.top
          && y < (this.height); // - this.margin.bottom
      },

      // HINT: helper function
      resetSelection() {
        const { heatmapBodyEl } = this.$refs;
        d3.select(heatmapBodyEl)
          .selectAll('rect')
          .classed('selected', false);
        this.rangeSelection = null;        
        this.$emit('selection', null);
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mouseMove(mouseEvent, d) {        
        // TODO: implement logic
        mouseEvent.stopPropagation();
        if (!this.rangeSelection || !d) return;
        // prevent to calculate following section repeatedly, if we do not, when keep moving on same rect, it calls this section repeatedly.
        if (d.date === this.rangeSelection[1]) return;        
        const that = this;
        const { heatmapBodyEl } = this.$refs;
        d3.select(heatmapBodyEl).selectAll('.day-rect').each(function recty(rect) {
          if (inRange(rect.date, that.rangeSelection[0], d.date)) {
            d3.select(this).classed('selected', true);
          } else {
            d3.select(this).classed('selected', false);
          }
        });
        this.rangeSelection[1] = d.date;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mouseDown(mouseEvent, d) {
        // TODO: implement logic
        mouseEvent.stopPropagation();
        if (!d) return;
        this.resetSelection();
        this.rangeSelection = [d.date, null];
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mouseUp(mouseEvent) {
        // TODO: implement logic
        mouseEvent.stopPropagation();
        if (!this.rangeSelection) return;
        this.$emit('selection', this.rangeSelection);
        this.rangeSelection = null;
      },
    },
    computed: {
      padded() {
        const width = this.containerWidth - this.margin.left - this.margin.right;
        const height = this.height - this.margin.top - this.margin.bottom;
        return { width, height };
      },
      minDate() {
        if (!this.data || this.data.length === 0) return m().startOf('year').toDate();
        return m(this.data[0].date).startOf('year').toDate();
      },
      maxDate() {
        if (!this.data || this.data.length === 0) return m().endOf('year').toDate();
        return m(this.data[0].date).endOf('year').toDate();
      },
      numberOfWeeks() {
        if (!this.data || this.data.length === 0) return d3.timeWeeks(m().startOf('year').toDate(), m().endOf('year').toDate());
        return Math.abs(m(this.data[0].date).endOf('year').diff(m(this.data[0].date).startOf('year'), 'weeks'));
      },
      cellSize() {
        return Math.floor(this.padded.width / this.numberOfWeeks);
      },
      listeners() {
        return {
          mousemove: this.mouseMove,
          mousedown: this.mouseDown,
          mouseup: this.mouseUp,
        };
      },
    },
    mounted() {
      this.onResize();
      this.setHeight();
      this.registerResizeObserver();
    },
    beforeDestroy() {
      if (this.resizeObserver) this.resizeObserver.disconnect();
    },
  };
</script>

<style lang="scss" scoped>
  @import "./../buefyStyles";
  
  svg text {
    user-select: none;
  }

  .calendar-heatmap-container {

    .heatmap {

      .heatmap-body {

        & ::v-deep .month-divider {
          stroke-width: 1px;
          stroke: $js-color-gray-2;
          fill: none;
        }
        & ::v-deep .dow {
          fill: $js-color-white;
          font-size: 0.7em;
        }
        & ::v-deep .moy {
          fill: $js-color-white;
          font-size: 0.7em;
        }
        & ::v-deep .noselect {
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        & ::v-deep .day-rect {
          fill: $js-color-style-two;
          stroke: $js-color-style-one;
          stroke-width: 3px;
          &.selected {
            // fill-opacity: 0.2;
            fill: $js-color-yellow !important;
          }
          &:hover {
            // fill: $js-color-gray-2;
            stroke-width: 1px;
            stroke: $js-color-yellow;
          }
        }

      }

    }

  }
</style>
