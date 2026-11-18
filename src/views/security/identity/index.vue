<template>
  <div class="app-container">
    <el-alert
      title="身份目录由 EDD-ORG 员工主数据同步；下方启停只作用于登录账号与 EIAM 凭据，不修改员工主数据。"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
    />

    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="关键词" prop="key">
        <el-input
          v-model="queryParams.key"
          placeholder="工号 / 姓名 / 手机号"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="目录状态" clearable style="width: 160px">
          <el-option label="在职" value="ACTIVE" />
          <el-option label="停用" value="DISABLED" />
          <el-option label="离职" value="LEFT" />
          <el-option label="已删除" value="DELETED" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-key" size="mini" :disabled="single" @click="handleResetPassword">
          重置密码
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-circle-check" size="mini" :disabled="single" @click="handleEnable">
          启用
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-circle-close" size="mini" :disabled="single" @click="handleDisable">
          停用
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-unlock" size="mini" :disabled="single" @click="handleUnlock">
          解锁
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="identityList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="工号" align="center" prop="employeeCode" width="120" />
      <el-table-column label="姓名" align="center" prop="displayName" :show-overflow-tooltip="true" />
      <el-table-column label="手机号" align="center" prop="phone" width="130" />
      <el-table-column label="目录状态" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="凭据状态" align="center" width="110">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.locked" type="danger" size="mini">已锁定</el-tag>
          <el-tag v-else-if="scope.row.credentialEnabled" type="success" size="mini">已开通</el-tag>
          <el-tag v-else type="info" size="mini">未开通</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="须改密" align="center" width="90">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.pwdResetRequired" type="warning" size="mini">是</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="最近改密时间" align="center" prop="lastChangeTime" width="170">
        <template slot-scope="scope">
          <span>{{ scope.row.lastChangeTime ? parseTime(scope.row.lastChangeTime) : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="260" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-key" @click="resetRow(scope.row)">重置密码</el-button>
          <el-button size="mini" type="text" icon="el-icon-circle-check" @click="enableRow(scope.row)">启用</el-button>
          <el-button size="mini" type="text" icon="el-icon-circle-close" @click="disableRow(scope.row)">停用</el-button>
          <el-button size="mini" type="text" icon="el-icon-unlock" @click="unlockRow(scope.row)">解锁</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog title="一次性密码" :visible.sync="passwordOpen" width="480px" append-to-body :close-on-click-modal="false">
      <el-alert
        title="该密码仅显示这一次，关闭后无法再次查看。请立即记录并线下告知员工。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />
      <div class="password-box">
        <span class="pwd">{{ oneTimePassword }}</span>
      </div>
      <div class="tip">员工使用该密码登录 EIAM 单点登录页后，系统会要求其设置新密码。</div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="copyPassword">复制密码</el-button>
        <el-button @click="passwordOpen = false">我已记录，关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listIdentity,
  resetIdentityPassword,
  enableIdentity,
  disableIdentity,
  unlockIdentity
} from '@/api/security/identity'

export default {
  name: 'EiamIdentity',
  data() {
    return {
      loading: true,
      showSearch: true,
      identityList: [],
      total: 0,
      selectedRow: null,
      passwordOpen: false,
      oneTimePassword: '',
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        key: undefined,
        status: undefined
      }
    }
  },
  computed: {
    single() {
      return this.selectedRow ? false : true
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listIdentity(this.queryParams).then(response => {
        this.identityList = response.data.items || []
        this.total = response.data.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.selectedRow = selection.length === 1 ? selection[0] : null
    },
    statusLabel(status) {
      const map = { ACTIVE: '在职', DISABLED: '停用', LEFT: '离职', DELETED: '已删除' }
      return map[status] || status || '-'
    },
    statusTagType(status) {
      if (status === 'ACTIVE') {
        return 'success'
      }
      if (status === 'DISABLED') {
        return 'warning'
      }
      return 'info'
    },
    handleResetPassword() {
      if (this.selectedRow) {
        this.resetRow(this.selectedRow)
      }
    },
    resetRow(row) {
      this.$modal.confirm('确认重置员工「' + row.displayName + '（' + row.employeeCode + '）」的 EIAM 登录密码？重置后该员工须修改密码。')
        .then(() => resetIdentityPassword(row.employeeId))
        .then(response => {
          this.oneTimePassword = response.data.password
          this.passwordOpen = true
          this.getList()
        })
        .catch(() => {})
    },
    handleEnable() {
      if (this.selectedRow) {
        this.enableRow(this.selectedRow)
      }
    },
    enableRow(row) {
      this.$modal.confirm('确认启用员工「' + row.displayName + '」的登录账号？')
        .then(() => enableIdentity(row.employeeId))
        .then(() => {
          this.$modal.msgSuccess('启用成功')
          this.getList()
        })
        .catch(() => {})
    },
    handleDisable() {
      if (this.selectedRow) {
        this.disableRow(this.selectedRow)
      }
    },
    disableRow(row) {
      this.$modal.confirm('确认停用员工「' + row.displayName + '」的登录账号？停用后其单点登录与 MPT 本地登录均不可用。')
        .then(() => disableIdentity(row.employeeId))
        .then(() => {
          this.$modal.msgSuccess('停用成功')
          this.getList()
        })
        .catch(() => {})
    },
    handleUnlock() {
      if (this.selectedRow) {
        this.unlockRow(this.selectedRow)
      }
    },
    unlockRow(row) {
      this.$modal.confirm('确认解锁员工「' + row.displayName + '」的账号？')
        .then(() => unlockIdentity(row.employeeId))
        .then(() => {
          this.$modal.msgSuccess('解锁成功')
          this.getList()
        })
        .catch(() => {})
    },
    copyPassword() {
      const input = document.createElement('input')
      input.value = this.oneTimePassword
      document.body.appendChild(input)
      input.select()
      try {
        document.execCommand('copy')
        this.$modal.msgSuccess('密码已复制')
      } catch (e) {
        this.$modal.msgWarning('复制失败，请手动记录')
      }
      document.body.removeChild(input)
    }
  }
}
</script>

<style scoped>
.password-box {
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  padding: 14px;
  text-align: center;
}
.password-box .pwd {
  font-family: Menlo, Consolas, monospace;
  font-size: 20px;
  letter-spacing: 2px;
  color: #303133;
  word-break: break-all;
}
.tip {
  margin-top: 12px;
  color: #909399;
  font-size: 12px;
}
</style>
