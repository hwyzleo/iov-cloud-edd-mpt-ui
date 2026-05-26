<template>
  <el-dialog title="历史版本" :visible.sync="visible" width="900px" append-to-body>
    <el-table v-loading="loading" :data="historyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="快照时间" prop="snapshotTime" min-width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.snapshotTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作类型" prop="operationType" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.operationType === 'CREATE' ? 'success' : scope.row.operationType === 'UPDATE' ? 'primary' : 'danger'">
            {{ scope.row.operationType === 'CREATE' ? '创建' : scope.row.operationType === 'UPDATE' ? '更新' : scope.row.operationType === 'DELETE' ? '删除' : scope.row.operationType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作人" prop="operator" min-width="100" />
      <el-table-column label="版本" prop="version" width="80" align="center" />
      <el-table-column label="状态" prop="status" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'INACTIVE' ? 'info' : 'danger'">
            {{ scope.row.status === 'ACTIVE' ? '启用' : scope.row.status === 'INACTIVE' ? '停用' : scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" @click="handleViewDetail(scope.row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div slot="footer" class="dialog-footer">
      <el-button type="primary" :disabled="selectedRows.length !== 2" @click="handleCompare">对比差异</el-button>
      <el-button @click="visible = false">关 闭</el-button>
    </div>

    <!-- 快照详情对话框 -->
    <el-dialog title="快照详情" :visible.sync="detailVisible" width="600px" append-to-body>
      <el-form :model="detailForm" label-width="120px">
        <slot name="detail-fields" :data="detailForm" />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 快照对比对话框 -->
    <el-dialog title="快照对比" :visible.sync="compareVisible" width="800px" append-to-body>
      <el-table :data="compareData" border>
        <el-table-column label="字段名称" prop="fieldName" width="150" />
        <el-table-column label="快照A" prop="valueA" />
        <el-table-column label="快照B" prop="valueB" />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="compareVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script>
export default {
  name: 'HistorySnapshot',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    historyList: {
      type: Array,
      default: () => []
    },
    fields: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      visible: this.value,
      detailVisible: false,
      compareVisible: false,
      selectedRows: [],
      detailForm: {},
      compareData: []
    }
  },
  watch: {
    value(val) {
      this.visible = val
    },
    visible(val) {
      this.$emit('input', val)
    }
  },
  methods: {
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    handleViewDetail(row) {
      this.detailForm = { ...row }
      this.detailVisible = true
    },
    handleCompare() {
      if (this.selectedRows.length !== 2) return

      const rowA = this.selectedRows[0]
      const rowB = this.selectedRows[1]
      const data = []

      this.fields.forEach(field => {
        const valueA = rowA[field.prop]
        const valueB = rowB[field.prop]
        if (valueA !== valueB) {
          data.push({
            fieldName: field.label,
            valueA: this.formatFieldValue(valueA, field),
            valueB: this.formatFieldValue(valueB, field)
          })
        }
      })

      this.compareData = data
      this.compareVisible = true
    },
    formatFieldValue(value, field) {
      if (value === null || value === undefined) return '-'
      if (field.type === 'date') return this.parseTime(value)
      if (field.type === 'status') {
        const map = { ACTIVE: '启用', INACTIVE: '停用', DEPRECATED: '废弃', DRAFT: '草稿' }
        return map[value] || value
      }
      if (field.type === 'platformType') {
        const map = { FUEL: '燃油', BEV: '纯电', PHEV: '插混', EREV: '增程' }
        return map[value] || value
      }
      if (field.type === 'seriesType') {
        const map = { SEDAN: '轿车', SUV: 'SUV', MPV: 'MPV', PICKUP: '皮卡', COMMERCIAL: '商用车' }
        return map[value] || value
      }
      if (field.type === 'lifecycleStatus') {
        const map = { IN_DEVELOPMENT: '开发中', ON_SALE: '在售', DISCONTINUED: '已停产' }
        return map[value] || value
      }
      if (field.type === 'targetMarket') {
        const map = { DOMESTIC: '国内', OVERSEAS: '海外', GLOBAL: '全球' }
        return map[value] || value
      }
      return String(value)
    }
  }
}
</script>
