<template>
  <a-modal v-model:open="device_modal" :title="device_title" @cancel="cancel">
    <a-form :model="formDevice" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <a-form-item label="设备信息">
        <a-select
          v-model:value="formDevice.deviceId"
          mode="multiple"
          @change="change_device"
          style="width: 100%"
        >
          <a-select-option v-for="item in device_listData" :key="item.deviceId" :value="item.deviceId">
            {{ item.deviceName }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="设备名称">
        <a-input v-model:value="formDevice.subName" placeholder="请输入设备名称" />
      </a-form-item>
      <a-form-item label="设备描述">
        <a-input v-model:value="formDevice.desc" placeholder="请输入设备描述" />
      </a-form-item>
      <a-form-item label="名称显示">
        <a-radio-group v-model:value="formDevice.isVisibleName">
          <a-radio value="1">是</a-radio>
          <a-radio value="0">否</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="描述显示">
        <a-radio-group v-model:value="formDevice.isVisibleDesc">
          <a-radio value="1">是</a-radio>
          <a-radio value="0">否</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="设备组合">
        <a-radio-group v-model:value="formDevice.isVisibleGroup">
          <a-radio value="1">是</a-radio>
          <a-radio value="0">否</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="位置调整">
        <a-radio-group v-model:value="formDevice.isVisiblePosition">
          <a-radio value="1">是</a-radio>
          <a-radio value="0">否</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
    <template #footer>
      <a-space>
        <a-button type="primary" @click="submit">应用</a-button>
        <a-button @click="cancel">取消</a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script>
// 获取设备信息列表 json 数据
import devicesInfo from './resources/deviceInfo.json'

export default {
  name: 'addDeviceDialog',
  props: ['deviceData'],
  data() {
    return {
      device_modal: false,
      device_title: '绑定设备信息',
      device_listData: [],
      formDevice: {
        deviceId: '',
        deviceName: '',
        deviceType: '',
        subName: '',
        desc: '',
        isVisibleName: '1',
        isVisibleDesc: '1',
        isVisibleGroup: '1',
        isVisiblePosition: '1'
      }
    }
  },
  methods: {
    change_device(idArry) {
      const mew_name = []
      if (idArry.length > 0) {
        this.device_listData.forEach((v) => {
          idArry.forEach((k, i) => {
            if (idArry[i] === v.deviceId) {
              mew_name.push(v.deviceName)
              this.formDevice.subName = mew_name.join(',')
            }
          })
        })
      }
    },
    submit() {
      const resultDeviceData = []
      const _nameArr = this.formDevice.subName.split(',')
      this.formDevice.deviceId.forEach((v, i) => {
        resultDeviceData.push({
          deviceId: v,
          deviceName: _nameArr[i],
          subName: _nameArr[i],
          name: _nameArr[i],
          desc: this.formDevice.desc,
          deviceType: '',
          isVisibleName: String(this.formDevice.isVisibleName),
          isVisibleDesc: String(this.formDevice.isVisibleDesc),
          isVisibleGroup: '1',
          isVisiblePosition: '1'
        })
      })
      this.$emit('submitDevice', resultDeviceData)
      this.device_modal = false
    },
    cancel() {
      this.device_modal = false
    }
  },
  watch: {
    device_modal(data) {
      if (data && this.deviceData) {
        this.formDevice = {
          deviceId: this.deviceData.deviceId,
          subName: this.deviceData.deviceName,
          desc: this.deviceData.desc,
          deviceName: this.deviceData.deviceName,
          deviceType: '',
          isVisibleName: String(this.deviceData.isVisibleName),
          isVisibleDesc: String(this.deviceData.isVisibleDesc),
          isVisibleGroup: String(this.deviceData.isVisibleGroup) || '1',
          isVisiblePosition: String(this.deviceData.isVisiblePosition) || '1'
        }
      }
    }
  },
  mounted() {
    devicesInfo.forEach((v) => {
      this.device_listData.push({
        deviceId: v.deviceId,
        deviceName: v.deviceName,
        deviceType: v.deviceType
      })
    })
  }
}
</script>
