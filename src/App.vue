<template>
  <div class="app">
    <!-- <span class="message">Have fun!</span> -->
    <div class="content-container">
      <div class="content">
        <div class="selection-container">
          <div class="range-selection" v-if="currentSelection" @click="notify('navigate')">
            <span class="from">{{ currentSelection[0] | rangeDate }}</span>
            <span class="separator" v-if="currentSelection.length === 2"> to </span>
            <span class="to" v-if="currentSelection.length === 2">{{ currentSelection[1] | rangeDate }}</span>
            <div class="go">
              <b-icon icon="arrow-alt-circle-right"></b-icon>
            </div>
          </div>
        </div>
        <CalendarHeatmap
          :data="internalData"
          @selection="handleSelection"
        />
      </div>
    </div>
  </div>
</template>

<script>

  // dependencies
  import _ from 'lodash';
  import m from 'moment';

  // components
  import CalendarHeatmap from './components/CalendarHeatmap.vue';

  export default {
    name: 'App',
    components: {
      CalendarHeatmap,
    },
    data() {
      return {
        currentSelection: null,
        internalData: [],
      };
    },
    methods: {
      generateMockData(yearOffset = 0) {
        this.internalData = _.map(_.range(m.utc().subtract(yearOffset, 'years').endOf('year').diff(m.utc().subtract(yearOffset, 'years').startOf('year'), 'days') + 1), (d) => ({
          // eslint-disable-next-line newline-per-chained-call
          date: m.utc().subtract(yearOffset, 'years').startOf('year').add(d, 'days').toDate(),
          value: _.random(0, 100) / 100,
        }));
      },
      handleSelection(selection) {
        // ! NOTE: do not allow point selection for now
        this.currentSelection = selection && selection.length === 2 ? selection.sort((a, b) => a - b) : null;
      },
      notify(text) {
        this.$buefy.toast.open(text);
      },
    },
    filters: {
      rangeDate: (d) => m(d).format('DD-MM-YYYY'),
    },
    beforeMount() {
      this.generateMockData();
    },
  };
</script>

<style lang="scss">
  @import "./buefyStyles";

  .app {
    height: 100vh;
    background: #24292e;
  }

  .content-container {
    height: 100%;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .content {
      min-width: 1000px;
      max-width: 1200px;
      padding: $el-spacing;
    }

  }
  .selection-container { 
    display: flex;
    justify-content: left;
    margin-bottom: $el-spacing;
    min-height: $el-spacing*2;

    .range-selection {
      $range-selection-height: $el-spacing*2;
      display: flex;
      flex-direction: row;
      align-items: center;
      background-color: $js-color-style-one;
      border-radius: $range-selection-height;
      cursor: pointer;
      span {
        font-weight: 600;
        font-size: 0.9em;
        color: $js-color-white;
        padding: 0 $el-spacing/2;
        height: $range-selection-height;
        line-height: $range-selection-height;
      }
      // .from {
      //   // background-color: $js-color-style-two;
      // }
      .separator {
        font-weight: 200;
        padding: 0 $el-spacing/3;
      }
      // .to {
      //   // background-color: $js-color-style-two;
      // }
      .go {
        display: flex;
        border-radius: 50%;
        width: $range-selection-height;
        height: $range-selection-height;
        background-color: $js-color-style-two;
        justify-content: center;
        & > span {
          align-self: center;
        }
      }
      &:hover {
        .go {
          background-color: $js-color-yellow;
          & > span {
            color: $js-color-style-two;
          }
        }
      }
    }
  }

  .message {
    color: #ffcc0d;
    font-size: 4rem;
    background: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

</style>
