<template>
  <div class="app-container">
    <el-row :gutter="20">
      <splitpanes :horizontal="this.$store.getters.device === 'mobile'" class="default-theme">
        <!--组织架构数据-->
        <pane size="16">
          <el-col>
            <div class="head-container">
              <el-input v-model="orgKey" placeholder="请输入组织名称" clearable size="small"
                        prefix-icon="el-icon-search" style="margin-bottom: 20px"
              />
            </div>
            <div class="head-container">
              <el-tree :data="orgOptions" :props="defaultProps" :expand-on-click-node="false"
                       :filter-node-method="filterNode" ref="tree" node-key="id" default-expand-all highlight-current
                       @node-click="handleNodeClick"
              />
            </div>
          </el-col>
        </pane>
        <!--用户数据-->
        <pane size="84">
          <el-col>
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
              <el-form-item label="门店代码" prop="code">
                <el-input
                  v-model="queryParams.code"
                  placeholder="请输入门店代码"
                  clearable
                  style="width: 150px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item label="门店全称" prop="name">
                <el-input
                  v-model="queryParams.name"
                  placeholder="请输入门店全称"
                  clearable
                  style="width: 200px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item label="创建时间">
                <el-date-picker
                  v-model="dateRange"
                  style="width: 240px"
                  value-format="yyyy-MM-dd"
                  type="daterange"
                  range-separator="-"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                ></el-date-picker>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-form>
            <el-row :gutter="10" class="mb8">
              <el-col :span="1.5">
                <el-button
                  type="primary"
                  plain
                  icon="el-icon-plus"
                  size="mini"
                  @click="handleAdd"
                  v-hasPermi="['org:dealership:info:add']"
                >新增
                </el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button
                  type="success"
                  plain
                  icon="el-icon-edit"
                  size="mini"
                  :disabled="single"
                  @click="handleUpdate"
                  v-hasPermi="['org:dealership:info:edit']"
                >修改
                </el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button
                  type="danger"
                  plain
                  icon="el-icon-delete"
                  size="mini"
                  :disabled="multiple"
                  @click="handleDelete"
                  v-hasPermi="['org:dealership:info:remove']"
                >删除
                </el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button
                  type="warning"
                  plain
                  icon="el-icon-download"
                  size="mini"
                  @click="handleExport"
                  v-hasPermi="['org:dealership:info:export']"
                >导出
                </el-button>
              </el-col>
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
            </el-row>

            <el-table v-loading="loading" :data="dealershipList" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="55" align="center"/>
              <el-table-column label="门店代码" prop="code" width="120"/>
              <el-table-column label="门店全称" prop="name" width="200"/>
              <el-table-column label="门店地址" prop="address" width="300"/>
              <el-table-column label="排序" prop="sort" align="center"/>
              <el-table-column label="创建时间" align="center" prop="createTime" width="180">
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="150" fixed="right"
                               class-name="small-padding fixed-width"
              >
                <template slot-scope="scope">
                  <el-button
                    size="mini"
                    type="text"
                    icon="el-icon-edit"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['org:dealership:info:edit']"
                  >修改
                  </el-button>
                  <el-button
                    size="mini"
                    type="text"
                    icon="el-icon-delete"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['org:dealership:info:remove']"
                  >删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <pagination
              v-show="total>0"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              @pagination="getList"
            />
          </el-col>
        </pane>
      </splitpanes>
    </el-row>

    <!-- 添加或修改门店配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="门店代码" prop="code">
              <el-input v-model="form.code" placeholder="请输入门店代码"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="门店简称" prop="shortName">
              <el-input v-model="form.shortName" placeholder="请输入门店简称"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item label="门店全称" prop="name">
            <el-input v-model="form.name" placeholder="请输入门店全称"/>
          </el-form-item>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="英文名称" prop="engName">
              <el-input v-model="form.engName" placeholder="请输入英文名称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="曾用名称" prop="formerName">
              <el-input v-model="form.formerName" placeholder="请输入曾用名称"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item label="门店地址" prop="address">
            <el-input v-model="form.address" placeholder="请输入门店地址"/>
          </el-form-item>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="经营类型" prop="storeFormat">
              <el-select
                v-model="form.storeFormat"
                placeholder="请选择经营类型"
                clearable
              >
                <el-option label="直营" :value="1"/>
                <el-option label="授权" :value="2"/>
                <el-option label="经销" :value="3"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务类型" prop="serviceType">
              <el-select
                v-model="form.serviceType"
                placeholder="请选择服务类型"
                clearable
                multiple
              >
                <el-option label="销售" value="S"/>
                <el-option label="交付" value="D"/>
                <el-option label="售后" value="A"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="组织" prop="orgCode">
              <el-input v-if="orgReadOnly" v-model="form.orgName" disabled/>
              <el-select
                v-else
                v-model="form.orgCode"
                placeholder="请选择组织"
                clearable
                @change="handleOrgChange"
              >
                <el-option
                  v-for="org in orgList"
                  :key="org.id"
                  :label="org.label"
                  :value="org.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="大区" prop="regionCode">
              <el-input v-if="regionReadOnly" v-model="form.regionName" disabled/>
              <el-select
                v-else
                v-model="form.regionCode"
                placeholder="请选择大区"
                clearable
                @change="handleRegionChange"
              >
                <el-option
                  v-for="region in regionList"
                  :key="region.id"
                  :label="region.label"
                  :value="region.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="小区" prop="areaCode">
              <el-input v-if="areaReadOnly" v-model="form.areaName" disabled/>
              <el-select
                v-else
                v-model="form.areaCode"
                placeholder="请选择小区"
                clearable
                @change="handleAreaChange"
              >
                <el-option
                  v-for="area in areaList"
                  :key="area.id"
                  :label="area.label"
                  :value="area.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" controls-position="right" :min="0"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listDealership,
  getDealership,
  addDealership,
  updateDealership,
  delDealership,
  orgTreeSelect
} from '@/api/org/dealership/info'
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

export default {
  name: 'Dealership',
  dicts: [],
  components: { Treeselect, Splitpanes, Pane },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      dealershipList: [],
      // 组织列表
      orgList: [],
      // 大区列表
      regionList: [],
      // 小区列表
      areaList: [],
      // 组织是否只读
      orgReadOnly: false,
      // 大区是否只读
      regionReadOnly: false,
      // 小区是否只读
      areaReadOnly: false,
      // 弹出层标题
      title: '',
      // 组织树选项
      orgOptions: undefined,
      // 当前选中节点信息
      currentNode: {
        data: null,
        node: null
      },
      // 是否显示弹出层
      open: false,
      // 组织关键词
      orgKey: undefined,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      // 表单校验
      rules: {
        code: [
          { required: true, message: '门店代码不能为空', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '门店全称不能为空', trigger: 'blur' }
        ],
        orgCode: [
          { required: true, message: '组织不能为空', trigger: 'change' }
        ],
        regionCode: [
          { required: true, message: '大区不能为空', trigger: 'change' }
        ],
        areaCode: [
          { required: true, message: '小区不能为空', trigger: 'change' }
        ],
        sort: [
          { required: true, message: '排序不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getOrgTree()
  },
  methods: {
    /** 查询门店列表 */
    getList() {
      this.loading = true
      listDealership(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.dealershipList = response.data.items
          this.total = response.data.total
          this.loading = false
        }
      )
    },
    /** 查询组织下拉树结构 */
    getOrgTree() {
      orgTreeSelect().then(response => {
        this.orgOptions = response.data
      })
    },
    // 组织选择变化
    handleOrgChange(orgId) {
      this.form.regionCode = undefined
      this.form.regionName = undefined
      this.form.areaCode = undefined
      this.form.areaName = undefined
      this.regionList = []
      this.areaList = []
      if (orgId && this.orgList.length > 0) {
        const selectedOrg = this.orgList.find(o => o.id === orgId)
        if (selectedOrg) {
          this.form.orgName = selectedOrg.label
          if (selectedOrg.children) {
            this.regionList = selectedOrg.children
          }
        }
      }
      this.$nextTick(() => {
        this.$refs.form.validateField('orgCode')
      })
    },
    // 大区选择变化
    handleRegionChange(regionId) {
      this.form.areaCode = undefined
      this.form.areaName = undefined
      this.areaList = []
      if (regionId && this.regionList.length > 0) {
        const selectedRegion = this.regionList.find(r => r.id === regionId)
        if (selectedRegion) {
          this.form.regionName = selectedRegion.label
          if (selectedRegion.children && selectedRegion.children.length > 0) {
            this.areaList = selectedRegion.children
          } else {
            const orgInfo = this.findOrgInfoFromTree(this.form.orgCode, regionId, undefined)
            this.areaList = orgInfo.areaList || []
          }
        }
      }
      this.$nextTick(() => {
        this.$refs.form.validateField('regionCode')
      })
    },
    // 小区选择变化
    handleAreaChange(areaId) {
      if (areaId && this.areaList.length > 0) {
        const selectedArea = this.areaList.find(a => a.id === areaId)
        if (selectedArea) {
          this.form.areaName = selectedArea.label
        }
      }
      this.$nextTick(() => {
        this.$refs.form.validateField('areaCode')
      })
    },
    // 筛选节点
    filterNode(value, data) {
      if (!value) return true
      return data.label.indexOf(value) !== -1
    },
// 根据orgCode、regionCode和areaCode从树中查找组织信息
    findOrgInfoFromTree(orgCode, regionCode, areaCode) {
      let result = {
        orgCode: undefined,
        orgName: undefined,
        regionName: undefined,
        areaName: undefined,
        regionList: [],
        areaList: []
      }
      if (!this.orgOptions) return result

      for (const org of this.orgOptions) {
        if (orgCode && org.id !== orgCode) continue

        result.orgCode = org.id
        result.orgName = org.label

        if (org.children) {
          result.regionList = org.children
          if (regionCode) {
            for (const region of org.children) {
              if (region.id === regionCode) {
                result.regionName = region.label
                if (region.children) {
                  result.areaList = region.children
                  if (areaCode) {
                    for (const area of region.children) {
                      if (area.id === areaCode) {
                        result.areaName = area.label
                        break
                      }
                    }
                  }
                }
                return result
              }
            }
          }
        }
        if (orgCode) return result
      }
      return result
    },
    // 节点单击事件
    handleNodeClick(data, node) {
      this.currentNode = {
        data: data,
        node: node
      }
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        regionCode: undefined,
        areaCode: undefined
      }
      if (data.type === 'REGION') {
        this.queryParams.regionCode = data.id
      }
      if (data.type === 'AREA') {
        this.queryParams.areaCode = data.id
      }
      this.handleQuery()
    },
    /** 取消按钮 */
    cancel() {
      this.open = false
      this.reset()
    },
    /** 表单重置 */
    reset() {
      this.form = {
        code: undefined,
        name: undefined,
        shortName: undefined,
        engName: undefined,
        formerName: undefined,
        address: undefined,
        storeFormat: undefined,
        serviceType: undefined,
        orgCode: undefined,
        orgName: undefined,
        regionCode: undefined,
        regionName: undefined,
        areaCode: undefined,
        areaName: undefined,
        sort: 99
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = []
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        regionCode: undefined,
        areaCode: undefined
      }
      this.resetForm('queryForm')
      this.handleQuery()
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加门店'
      this.orgReadOnly = false
      this.regionReadOnly = false
      this.areaReadOnly = false
      this.orgList = this.orgOptions || []
      if (this.currentNode.data) {
        const nodeType = this.currentNode.data.type
        const node = this.currentNode.node
        if (nodeType === 'ORG') {
          this.$set(this.form, 'orgCode', this.currentNode.data.id)
          this.$set(this.form, 'orgName', this.currentNode.data.label)
          this.orgReadOnly = true
          this.regionList = this.currentNode.data.children || []
          this.areaList = []
        } else if (nodeType === 'REGION') {
          this.$set(this.form, 'orgCode', node.parent ? node.parent.data.id : undefined)
          this.$set(this.form, 'orgName', node.parent ? node.parent.data.label : undefined)
          this.$set(this.form, 'regionCode', this.currentNode.data.id)
          this.$set(this.form, 'regionName', this.currentNode.data.label)
          this.orgReadOnly = true
          this.regionReadOnly = true
          this.regionList = []
          this.areaList = this.currentNode.data.children || []
        } else if (nodeType === 'AREA') {
          this.$set(this.form, 'orgCode', node.parent && node.parent.parent ? node.parent.parent.data.id : undefined)
          this.$set(this.form, 'orgName', node.parent && node.parent.parent ? node.parent.parent.data.label : undefined)
          this.$set(this.form, 'regionCode', node.parent ? node.parent.data.id : undefined)
          this.$set(this.form, 'regionName', node.parent ? node.parent.data.label : undefined)
          this.$set(this.form, 'areaCode', this.currentNode.data.id)
          this.$set(this.form, 'areaName', this.currentNode.data.label)
          this.orgReadOnly = true
          this.regionReadOnly = true
          this.areaReadOnly = true
          this.regionList = []
          this.areaList = []
        }
      } else {
        this.regionList = []
        this.areaList = []
      }
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      this.orgReadOnly = true
      this.regionReadOnly = true
      this.areaReadOnly = true
      this.orgList = this.orgOptions || []
      const dealershipId = row.id || this.ids
      getDealership(dealershipId).then(response => {
        this.form = response.data
        if (this.form.serviceType && typeof this.form.serviceType === 'string') {
          this.form.serviceType = this.form.serviceType.split(',')
        }
        const orgInfo = this.findOrgInfoFromTree(this.form.orgCode, this.form.regionCode, this.form.areaCode)
        this.form.orgName = orgInfo.orgName
        this.form.regionName = orgInfo.regionName
        this.form.areaName = orgInfo.areaName
        this.regionList = orgInfo.regionList
        this.areaList = orgInfo.areaList
        this.open = true
      })
      this.title = '修改门店'
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          const submitData = { ...this.form }
          if (submitData.serviceType && Array.isArray(submitData.serviceType)) {
            submitData.serviceType = submitData.serviceType.join(',')
          }
          if (this.form.id !== undefined) {
            updateDealership(submitData).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addDealership(submitData).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const dealershipIds = row.id || this.ids
      this.$modal.confirm('是否确认删除门店ID为"' + dealershipIds + '"的数据项？').then(function() {
        return delDealership(dealershipIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {
      })
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edd-org/dealership/export', {
        ...this.queryParams
      }, `dealership_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
