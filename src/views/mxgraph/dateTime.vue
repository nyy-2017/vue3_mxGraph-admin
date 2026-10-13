<template>
  <div>
    <a-date-picker
      v-model:value="selectDate"
      show-time
      format="YYYY-MM-DD HH:mm:ss"
      :disabled-date="disabledDate"
      placeholder="选择日期时间"
      @change="handle"
    />
  </div>
</template>

<script>
import { nowTime } from '../../utils/times'
import dayjs from 'dayjs'

export default {
  data() {
    return {
      selectDate: '',
      getTimes: nowTime().substring(11)
    }
  },
  mounted() {
    this.selectDate = dayjs(nowTime())
  },
  methods: {
    disabledDate(time) {
      return time.valueOf() < Date.now() - 1 * 24 * 3600 * 1000
    },
    handle() {
      const startAt = new Date(this.selectDate).getTime()
      if (startAt < Date.now()) {
        this.selectDate = dayjs()
      }
    }
  }
}
</script>
