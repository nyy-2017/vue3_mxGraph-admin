<template>
  <a-modal v-model:open="type_modal" :title="type_title" @cancel="cancel">
    <a-form :model="formItem" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <a-form-item label="设备类型">
        <a-select
          v-model:value="formItem.type"
          @change="change_tpye"
          :disabled="!!(typeData && typeData.type)"
        >
          <a-select-option v-for="item in type_listData" :key="item.type" :value="item.type">
            {{ item.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="图元样式">
        <a-select
          v-model:value="formItem.style"
          @change="change_style"
          :disabled="!(typeData && typeData.type)"
        >
          <a-select-option v-for="item in type_listData" :key="item.style" :value="item.style">
            {{ item.styleName }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="类型名称">
        <a-input v-model:value="formItem.name" :disabled="!!(typeData && typeData.type)" />
      </a-form-item>
      <a-form-item label="名称是否显示">
        <a-radio-group v-model:value="formItem.isVisibleName">
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
// 设备类型接口返回的所有数据
import deviceTypeData from './resources/deviceTypeData.json'

export default {
  name: 'addTypeDialog',
  props: ['typeData'],
  data() {
    return {
      type_title: '添加设备类型',
      type_modal: false,
      type_listData: [],
      formItem: {
        type: '',
        name: '',
        style: '',
        styleName: '',
        isVisibleName: '1' // 1-默认显示 0-不显示
      }
    }
  },
  methods: {
    change_tpye(typeId) {
      if (typeId) {
        this.type_listData.forEach((v) => {
          if (typeId === v.type) this.formItem.name = v.name
        })
      }
    },
    change_style() {},
    submit() {
      this.$emit('submit', this.formItem)
      this.type_modal = false
    },
    cancel() {
      this.type_modal = false
    }
  },
  watch: {
    type_modal(data) {
      if (data && this.typeData) {
        this.formItem = {
          type: String(this.typeData.type),
          name: this.typeData.name,
          style: this.typeData.style,
          styleName: '',
          isVisibleName: String(this.typeData.isVisibleName) || '1'
        }
        this.type_title = this.typeData.type ? '修改设备类型' : '添加设备类型'
      }
    }
  },
  mounted() {
    deviceTypeData.forEach((v) => {
      this.type_listData.push({
        type: v.type.toString(),
        name: v.name,
        style: v.style,
        styleName: v.styleName
      })
    })
  }
}
</script>
