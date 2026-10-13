<template>
  <div>
    <a-card title="权限配置">
      <div>已选中的权限：{{ selectedPermissions.join(', ') }}</div>
      <a-tree
        :tree-data="treeData"
        :default-expanded-keys="expandedKeys"
        checkable
        :checked-keys="selectedPermissions"
        @check="onCheck"
      />
    </a-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedPermissions: [],
      expandedKeys: ['p1', 'p1_1', 'p1_2'],
      treeData: [
        {
          title: '后台管理',
          key: 'p1',
          children: [
            {
              title: '管理员',
              key: 'p1_1',
              children: [
                {
                  title: '用户列表',
                  key: 'p1_1_1',
                  children: [
                    { title: '浏览', key: 'p1_1_1_view', isLeaf: true },
                    { title: '创建', key: 'p1_1_1_create', isLeaf: true },
                    { title: '更新', key: 'p1_1_1_update', isLeaf: true },
                    { title: '删除', key: 'p1_1_1_remove', isLeaf: true },
                    { title: '导出', key: 'p1_1__export', isLeaf: true }
                  ]
                },
                {
                  title: '角色列表',
                  key: 'p1_1_2',
                  children: [{ title: '浏览', key: 'p1_1_2_view', isLeaf: true }]
                }
              ]
            },
            {
              title: '操作员',
              key: 'p1_2',
              children: [
                { title: '操作员一', key: 'p1_2_1', children: [{ title: '浏览', key: 'p1_2_1_view', isLeaf: true }] },
                { title: '操作员二', key: 'p1_2_2', children: [{ title: '浏览', key: 'p1_2_2_view', isLeaf: true }] }
              ]
            }
          ]
        }
      ]
    }
  },
  methods: {
    onCheck(checkedKeys) {
      this.selectedPermissions = checkedKeys
    }
  }
}
</script>
