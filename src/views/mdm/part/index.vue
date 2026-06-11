<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="物料分类" prop="categoryCode">
        <el-input
          v-model="queryParams.categoryCode"
          placeholder="请输入物料分类编码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="零件类型" prop="partType">
        <el-select v-model="queryParams.partType" placeholder="请选择零件类型" clearable style="width: 150px">
          <el-option
            v-for="item in partTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="车载节点" prop="vehicleNodeCode">
        <el-input
          v-model="queryParams.vehicleNodeCode"
          placeholder="请输入车载节点编码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="供应商" prop="supplierCode">
        <el-input
          v-model="queryParams.supplierCode"
          placeholder="请输入供应商编码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="生命周期" prop="lifecycleStage">
        <el-select v-model="queryParams.lifecycleStage" placeholder="请选择生命周期阶段" clearable style="width: 150px">
          <el-option
            v-for="item in lifecycleStageOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="包含停用">
        <el-checkbox v-model="queryParams.includeInactive">包含停用数据</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:part:add']"
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:part:edit']"
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:part:remove']"
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:part:export']"
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="partList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="零件编码" prop="code" width="120" />
      <el-table-column label="零件基础号" prop="baseNo" width="120" />
      <el-table-column label="发号来源" prop="numberingSource" width="100">
        <template slot-scope="scope">
          {{ getNumberingSourceLabel(scope.row.numberingSource) }}
        </template>
      </el-table-column>
      <el-table-column label="是否总成件" prop="isAssembly" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.isAssembly ? 'success' : 'info'">
            {{ scope.row.isAssembly ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="零件名称" prop="name" />
      <el-table-column label="物料分类" prop="categoryCode" width="120" />
      <el-table-column label="零件类型" prop="partType" width="100">
        <template slot-scope="scope">
          {{ getPartTypeLabel(scope.row.partType) }}
        </template>
      </el-table-column>
      <el-table-column label="车载节点" prop="vehicleNodeCode" width="100" />
      <el-table-column label="供应商" prop="supplierCode" width="100" />
      <el-table-column label="关重特性" prop="isKeyPart" width="80" align="center">
        <template slot-scope="scope">
          {{ getKeyPartLabel(scope.row.isKeyPart) }}
        </template>
      </el-table-column>
      <el-table-column label="是否软件" prop="isSoftware" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.isSoftware ? 'success' : 'info'">
            {{ scope.row.isSoftware ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="生命周期" prop="lifecycleStage" width="100">
        <template slot-scope="scope">
          {{ getLifecycleStageLabel(scope.row.lifecycleStage) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'INACTIVE' ? 'info' : scope.row.status === 'DEPRECATED' ? 'danger' : 'warning'">
            {{ scope.row.status === 'ACTIVE' ? '启用' : scope.row.status === 'INACTIVE' ? '停用' : scope.row.status === 'DEPRECATED' ? '废弃' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center" />
      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="340" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['mdm:part:edit']"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            v-hasPermi="['mdm:part:remove']"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
          >停用</el-button>
          <el-button
            v-if="scope.row.status === 'DRAFT'"
            v-hasPermi="['mdm:part:remove']"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
          >删除</el-button>
          <el-button
            v-hasPermi="['mdm:part:edit']"
            size="mini"
            type="text"
            icon="el-icon-refresh"
            @click="handleUpgradeGeneration(scope.row)"
          >代次升级</el-button>
          <el-button
            v-hasPermi="['mdm:part:edit']"
            size="mini"
            type="text"
            icon="el-icon-edit-outline"
            @click="handleMinorRevision(scope.row)"
          >小修订</el-button>
          <el-button
            v-hasPermi="['mdm:part:query']"
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleHistory(scope.row)"
          >查看历史</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.size"
      @pagination="getList"
    />

    <!-- 添加或修改零件对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手动指定零件号">
              <el-switch v-model="manualCodeMode" />
            </el-form-item>
          </el-col>
          <el-col v-if="manualCodeMode" :span="12">
            <el-form-item label="零件编码" prop="code">
              <el-input v-model="form.code" placeholder="请输入零件编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="零件名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入零件名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="本地化名称" prop="nameLocal">
              <el-input v-model="form.nameLocal" placeholder="请输入本地化名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料分类" prop="categoryCode">
              <el-input v-model="form.categoryCode" placeholder="请输入物料分类编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="零件类型" prop="partType">
              <el-select v-model="form.partType" placeholder="请选择零件类型" clearable style="width: 100%">
                <el-option
                  v-for="item in partTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车载节点" prop="vehicleNodeCode">
              <el-select
                v-model="form.vehicleNodeCode"
                filterable
                remote
                clearable
                reserve-keyword
                placeholder="请输入车载节点搜索"
                :remote-method="remoteVehicleNodeSearch"
                :loading="vehicleNodeLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="item in vehicleNodeList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplierCode">
              <el-select
                v-model="form.supplierCode"
                filterable
                remote
                clearable
                reserve-keyword
                placeholder="请输入供应商搜索"
                :remote-method="remoteSupplierSearch"
                :loading="supplierLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="item in supplierList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生命周期阶段" prop="lifecycleStage">
              <el-select v-model="form.lifecycleStage" placeholder="请选择生命周期阶段" clearable style="width: 100%">
                <el-option
                  v-for="item in lifecycleStageOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关重特性" prop="isKeyPart">
              <el-select v-model="form.isKeyPart" placeholder="请选择关重特性" clearable style="width: 100%">
                <el-option
                  v-for="item in keyPartOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否软件" prop="isSoftware">
              <el-switch v-model="form.isSoftware" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="支持FOTA" prop="fotaUpgradeable">
              <el-switch v-model="form.fotaUpgradeable" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="安全关键件" prop="isSafetyCritical">
              <el-switch v-model="form.isSafetyCritical" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否法规件" prop="isRegulatoryPart">
              <el-switch v-model="form.isRegulatoryPart" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否架构件" prop="isFramePart">
              <el-switch v-model="form.isFramePart" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否精准追溯" prop="isAccuratelyTraced">
              <el-switch v-model="form.isAccuratelyTraced" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否有数模" prop="isDigitate">
              <el-switch v-model="form.isDigitate" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否总成件" prop="isAssembly">
              <el-switch v-model="form.isAssembly" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="功能配置特征码" prop="ffaCode">
              <el-input v-model="form.ffaCode" placeholder="请输入功能配置特征码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="功能配置特征描述" prop="ffaDesc">
              <el-input v-model="form.ffaDesc" placeholder="请输入功能配置特征描述" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="初始车型" prop="initialModel">
              <el-input v-model="form.initialModel" placeholder="请输入初始车型" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对应生产件号" prop="productionCode">
              <el-input v-model="form.productionCode" placeholder="请输入对应生产件号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="首次投产时间" prop="firstProductionDate">
              <el-date-picker
                v-model="form.firstProductionDate"
                type="date"
                placeholder="选择日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设计工程师" prop="designer">
              <el-input v-model="form.designer" placeholder="请输入设计工程师" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设计工程师部门" prop="designerDept">
              <el-input v-model="form.designerDept" placeholder="请输入设计工程师部门" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计量单位" prop="uom">
              <el-input v-model="form.uom" placeholder="请输入计量单位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图纸编号" prop="drawingNo">
              <el-input v-model="form.drawingNo" placeholder="请输入图纸编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图纸版本" prop="drawingVersion">
              <el-input v-model="form.drawingVersion" placeholder="请输入图纸版本" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="重量" prop="weight">
              <el-input-number v-model="form.weight" :precision="3" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重量单位" prop="weightUom">
              <el-input v-model="form.weightUom" placeholder="请输入重量单位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="替代零件编码" prop="substitutePartCode">
              <el-input v-model="form.substitutePartCode" placeholder="请输入替代零件编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="零件基础号">
              <el-input v-model="form.baseNo" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发号来源">
              <el-input v-model="form.numberingSource" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="effectiveDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            @change="handleEffectiveDateChange"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <history-snapshot
      v-model="historyVisible"
      :loading="historyLoading"
      :history-list="historyList"
      :fields="historyFields"
    >
      <template #detail-fields="{ data }">
        <el-form-item label="零件编码">{{ data.code }}</el-form-item>
        <el-form-item label="零件名称">{{ data.name }}</el-form-item>
        <el-form-item label="本地化名称">{{ data.nameLocal }}</el-form-item>
        <el-form-item label="物料分类">{{ data.categoryCode }}</el-form-item>
        <el-form-item label="零件类型">{{ getPartTypeLabel(data.partType) }}</el-form-item>
        <el-form-item label="车载节点">{{ data.vehicleNodeCode }}</el-form-item>
        <el-form-item label="供应商">{{ data.supplierCode }}</el-form-item>
        <el-form-item label="关重特性">{{ getKeyPartLabel(data.isKeyPart) }}</el-form-item>
        <el-form-item label="是否软件">{{ data.isSoftware ? '是' : '否' }}</el-form-item>
        <el-form-item label="支持FOTA">{{ data.fotaUpgradeable ? '是' : '否' }}</el-form-item>
        <el-form-item label="安全关键件">{{ data.isSafetyCritical ? '是' : '否' }}</el-form-item>
        <el-form-item label="是否法规件">{{ data.isRegulatoryPart ? '是' : '否' }}</el-form-item>
        <el-form-item label="是否架构件">{{ data.isFramePart ? '是' : '否' }}</el-form-item>
        <el-form-item label="是否精准追溯">{{ data.isAccuratelyTraced ? '是' : '否' }}</el-form-item>
        <el-form-item label="是否有数模">{{ data.isDigitate ? '是' : '否' }}</el-form-item>
        <el-form-item label="是否总成件">{{ data.isAssembly ? '是' : '否' }}</el-form-item>
        <el-form-item label="功能配置特征码">{{ data.ffaCode }}</el-form-item>
        <el-form-item label="功能配置特征描述">{{ data.ffaDesc }}</el-form-item>
        <el-form-item label="初始车型">{{ data.initialModel }}</el-form-item>
        <el-form-item label="对应生产件号">{{ data.productionCode }}</el-form-item>
        <el-form-item label="首次投产时间">{{ parseTime(data.firstProductionDate) }}</el-form-item>
        <el-form-item label="设计工程师">{{ data.designer }}</el-form-item>
        <el-form-item label="设计工程师部门">{{ data.designerDept }}</el-form-item>
        <el-form-item label="计量单位">{{ data.uom }}</el-form-item>
        <el-form-item label="图纸编号">{{ data.drawingNo }}</el-form-item>
        <el-form-item label="图纸版本">{{ data.drawingVersion }}</el-form-item>
        <el-form-item label="重量">{{ data.weight }}</el-form-item>
        <el-form-item label="重量单位">{{ data.weightUom }}</el-form-item>
        <el-form-item label="生命周期阶段">{{ getLifecycleStageLabel(data.lifecycleStage) }}</el-form-item>
        <el-form-item label="替代零件编码">{{ data.substitutePartCode }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="零件基础号">{{ data.baseNo }}</el-form-item>
        <el-form-item label="发号来源">{{ getNumberingSourceLabel(data.numberingSource) }}</el-form-item>
        <el-form-item label="是否总成件">{{ data.isAssembly ? '是' : '否' }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ data.status === 'ACTIVE' ? '启用' : data.status === 'INACTIVE' ? '停用' : data.status }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
      </template>
    </history-snapshot>

    <!-- 小修订弹窗 -->
    <el-dialog title="小修订" :visible.sync="minorRevisionOpen" width="500px" append-to-body>
      <el-form ref="minorRevisionForm" :model="minorRevisionForm" :rules="minorRevisionRules" label-width="100px">
        <el-form-item label="零件编码">
          <el-input v-model="minorRevisionForm.code" readonly />
        </el-form-item>
        <el-form-item label="新图纸版本" prop="drawingVersion">
          <el-input v-model="minorRevisionForm.drawingVersion" placeholder="请输入新图纸版本" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitMinorRevision">确 定</el-button>
        <el-button @click="minorRevisionOpen = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listPart,
  getPart,
  addPart,
  updatePart,
  delPart,
  deactivatePart,
  listPartHistory,
  upgradeGeneration,
  minorRevision
} from '@/api/mdm/part'
import { listAllVehicleNode } from '@/api/mdm/vehicleNode'
import { listAllSupplier } from '@/api/mdm/supplier'
import HistorySnapshot from '@/components/HistorySnapshot/index.vue'

const PART_TYPE_OPTIONS = [
  { label: '原材料', value: 'RAW_MATERIAL' },
  { label: '标准件', value: 'STANDARD_PART' },
  { label: '定制件', value: 'CUSTOM_PART' },
  { label: '软件', value: 'SOFTWARE' },
  { label: '总成件', value: 'ASSEMBLY' }
]

const PART_TYPE_MAP = {
  'RAW_MATERIAL': '原材料',
  'STANDARD_PART': '标准件',
  'CUSTOM_PART': '定制件',
  'SOFTWARE': '软件',
  'ASSEMBLY': '总成件'
}

const LIFECYCLE_STAGE_OPTIONS = [
  { label: '样件', value: 'PROTOTYPE' },
  { label: '预量产', value: 'PRE_PRODUCTION' },
  { label: '量产', value: 'MASS_PRODUCTION' },
  { label: '停产过渡', value: 'PHASE_OUT' },
  { label: '淘汰', value: 'OBSOLETE' }
]

const LIFECYCLE_STAGE_MAP = {
  'PROTOTYPE': '样件',
  'PRE_PRODUCTION': '预量产',
  'MASS_PRODUCTION': '量产',
  'PHASE_OUT': '停产过渡',
  'OBSOLETE': '淘汰'
}

const KEY_PART_OPTIONS = [
  { label: '关键件', value: 'KEY' },
  { label: '重要件', value: 'MAJOR' },
  { label: '一般件', value: 'SIMPLE' }
]

const KEY_PART_MAP = {
  'KEY': '关键件',
  'MAJOR': '重要件',
  'SIMPLE': '一般件'
}

export default {
  name: 'MdmPart',
  components: {
    HistorySnapshot
  },
  dicts: [],
  data() {
    return {
      partTypeOptions: PART_TYPE_OPTIONS,
      lifecycleStageOptions: LIFECYCLE_STAGE_OPTIONS,
      keyPartOptions: KEY_PART_OPTIONS,
      vehicleNodeList: [],
      vehicleNodeLoading: false,
      supplierList: [],
      supplierLoading: false,
      loading: true,
      ids: [],
      codes: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      partList: [],
      title: '',
      open: false,
      effectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        categoryCode: undefined,
        partType: undefined,
        vehicleNodeCode: undefined,
        supplierCode: undefined,
        lifecycleStage: undefined,
        includeInactive: false
      },
      form: {},
      historyVisible: false,
      historyLoading: false,
      historyList: [],
      historyFields: [
        { prop: 'code', label: '零件编码' },
        { prop: 'name', label: '零件名称' },
        { prop: 'nameLocal', label: '本地化名称' },
        { prop: 'categoryCode', label: '物料分类' },
        { prop: 'partType', label: '零件类型' },
        { prop: 'vehicleNodeCode', label: '车载节点' },
        { prop: 'supplierCode', label: '供应商' },
        { prop: 'isKeyPart', label: '关重特性' },
        { prop: 'isSoftware', label: '是否软件' },
        { prop: 'fotaUpgradeable', label: '支持FOTA' },
        { prop: 'isSafetyCritical', label: '安全关键件' },
        { prop: 'isRegulatoryPart', label: '是否法规件' },
        { prop: 'isFramePart', label: '是否架构件' },
        { prop: 'isAccuratelyTraced', label: '是否精准追溯' },
        { prop: 'isDigitate', label: '是否有数模' },
        { prop: 'isAssembly', label: '是否总成件' },
        { prop: 'ffaCode', label: '功能配置特征码' },
        { prop: 'ffaDesc', label: '功能配置特征描述' },
        { prop: 'initialModel', label: '初始车型' },
        { prop: 'productionCode', label: '对应生产件号' },
        { prop: 'firstProductionDate', label: '首次投产时间', type: 'date' },
        { prop: 'designer', label: '设计工程师' },
        { prop: 'designerDept', label: '设计工程师部门' },
        { prop: 'uom', label: '计量单位' },
        { prop: 'drawingNo', label: '图纸编号' },
        { prop: 'drawingVersion', label: '图纸版本' },
        { prop: 'weight', label: '重量' },
        { prop: 'weightUom', label: '重量单位' },
        { prop: 'lifecycleStage', label: '生命周期阶段' },
        { prop: 'substitutePartCode', label: '替代零件编码' },
        { prop: 'description', label: '描述' },
        { prop: 'baseNo', label: '零件基础号' },
        { prop: 'numberingSource', label: '发号来源' },
        { prop: 'isAssembly', label: '是否总成件', type: 'boolean' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' }
      ],
      historyCode: '',
      manualCodeMode: false,
      minorRevisionOpen: false,
      minorRevisionForm: {
        code: '',
        drawingVersion: ''
      },
      minorRevisionRules: {
        drawingVersion: [
          { required: true, message: '新图纸版本不能为空', trigger: 'blur' }
        ]
      },
      rules: {
        code: [
          { required: true, message: '零件编码不能为空', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '零件名称不能为空', trigger: 'blur' }
        ],
        categoryCode: [
          { required: true, message: '物料分类编码不能为空', trigger: 'blur' }
        ],
        partType: [
          { required: true, message: '零件类型不能为空', trigger: 'change' }
        ],
        lifecycleStage: [
          { required: true, message: '生命周期阶段不能为空', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    hasManualCodePermission() {
      return this.$store.state.user.permissions.includes('mdm:material:part:code:manual')
    }
  },
  created() {
    this.getList()
    this.loadVehicleNodeList()
    this.loadSupplierList()
  },
  methods: {
    getList() {
      this.loading = true
      listPart(this.queryParams).then(response => {
        this.partList = response.data.rows
        this.total = response.data.total
        this.loading = false
      })
    },
    loadVehicleNodeList() {
      this.vehicleNodeLoading = true
      listAllVehicleNode().then(response => {
        this.vehicleNodeList = response.data.map(item => ({
          value: item.nodeCode,
          label: item.nodeCode + ' - ' + item.name
        }))
        this.vehicleNodeLoading = false
      })
    },
    loadSupplierList() {
      this.supplierLoading = true
      listAllSupplier().then(response => {
        this.supplierList = response.data.map(item => ({
          value: item.code,
          label: item.code + ' - ' + item.name
        }))
        this.supplierLoading = false
      })
    },
    remoteVehicleNodeSearch(query) {
      if (query !== '') {
        this.vehicleNodeLoading = true
        listAllVehicleNode().then(response => {
          this.vehicleNodeList = response.data
            .filter(item => item.nodeCode.toLowerCase().includes(query.toLowerCase()) || item.name.toLowerCase().includes(query.toLowerCase()))
            .map(item => ({
              value: item.nodeCode,
              label: item.nodeCode + ' - ' + item.name
            }))
          this.vehicleNodeLoading = false
        })
      }
    },
    remoteSupplierSearch(query) {
      if (query !== '') {
        this.supplierLoading = true
        listAllSupplier().then(response => {
          this.supplierList = response.data
            .filter(item => item.code.toLowerCase().includes(query.toLowerCase()) || item.name.toLowerCase().includes(query.toLowerCase()))
            .map(item => ({
              value: item.code,
              label: item.code + ' - ' + item.name
            }))
          this.supplierLoading = false
        })
      }
    },
    getPartTypeLabel(type) {
      return PART_TYPE_MAP[type] || type
    },
    getKeyPartLabel(keyPart) {
      return KEY_PART_MAP[keyPart] || keyPart
    },
    getLifecycleStageLabel(stage) {
      return LIFECYCLE_STAGE_MAP[stage] || stage
    },
    getNumberingSourceLabel(source) {
      const sourceMap = {
        'MDM_GEN': '系统生成',
        'PLM': 'PLM同步',
        'IMPORT': '存量导入'
      }
      return sourceMap[source] || source
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {
        code: undefined,
        name: undefined,
        nameLocal: undefined,
        description: undefined,
        categoryCode: undefined,
        partType: undefined,
        vehicleNodeCode: undefined,
        supplierCode: undefined,
        isSoftware: false,
        fotaUpgradeable: false,
        isSafetyCritical: false,
        isKeyPart: undefined,
        isRegulatoryPart: false,
        isFramePart: false,
        isAccuratelyTraced: false,
        ffaCode: undefined,
        ffaDesc: undefined,
        isDigitate: false,
        isAssembly: false,
        initialModel: undefined,
        productionCode: undefined,
        firstProductionDate: undefined,
        designer: undefined,
        designerDept: undefined,
        uom: undefined,
        drawingNo: undefined,
        drawingVersion: undefined,
        weight: undefined,
        weightUom: undefined,
        lifecycleStage: undefined,
        substitutePartCode: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined
      }
      this.effectiveDateRange = []
      this.manualCodeMode = false
      this.resetForm('form')
    },
    handleQuery() {
      this.queryParams.page = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.includeInactive = false
      this.queryParams.partType = undefined
      this.queryParams.lifecycleStage = undefined
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.codes = selection.map(item => item.code)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleEffectiveDateChange(val) {
      if (val) {
        this.form.effectiveFrom = val[0]
        this.form.effectiveTo = val[1]
      } else {
        this.form.effectiveFrom = undefined
        this.form.effectiveTo = undefined
      }
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加零件'
    },
    handleUpdate(row) {
      this.reset()
      const code = row.code || this.codes[0]
      getPart(code).then(response => {
        this.form = response.data
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo]
        }
        this.open = true
        this.title = '修改零件'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updatePart(this.form.code, this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            const submitData = { ...this.form }
            if (!this.manualCodeMode) {
              delete submitData.code
            }
            addPart(submitData).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleDeactivate(row) {
      const code = row.code
      this.$modal.confirm('是否确认停用零件"' + code + '"？').then(function() {
        return deactivatePart(code, '')
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('停用成功')
      }).catch(() => {})
    },
    handleDelete(row) {
      const code = row.code || this.codes[0]
      this.$modal.confirm('是否确认删除零件"' + code + '"？').then(function() {
        return delPart(code, '')
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleExport() {
      this.download('edd-mdm/api/mpt/material/part/v1/export', {
        ...this.queryParams
      }, `part_${new Date().getTime()}.xlsx`)
    },
    handleHistory(row) {
      this.historyCode = row.code
      this.historyVisible = true
      this.loadHistory()
    },
    loadHistory() {
      this.historyLoading = true
      listPartHistory(this.historyCode).then(response => {
        this.historyList = response.data.rows
        this.historyLoading = false
      })
    },
    handleUpgradeGeneration(row) {
      this.$modal.confirm('是否确认对零件"' + row.code + '"进行代次升级？升级后将生成新的零件号。').then(() => {
        return upgradeGeneration(row.code, this.$store.state.user.name)
      }).then((response) => {
        this.$modal.msgSuccess('代次升级成功，新零件号：' + response.data.code)
        this.getList()
      }).catch(() => {})
    },
    handleMinorRevision(row) {
      this.minorRevisionForm.code = row.code
      this.minorRevisionForm.drawingVersion = ''
      this.minorRevisionOpen = true
    },
    submitMinorRevision() {
      this.$refs['minorRevisionForm'].validate(valid => {
        if (valid) {
          minorRevision(this.minorRevisionForm.code, {
            drawingVersion: this.minorRevisionForm.drawingVersion,
            operator: this.$store.state.user.name
          }).then(response => {
            this.$modal.msgSuccess('小修订成功')
            this.minorRevisionOpen = false
            this.getList()
          })
        }
      })
    }
  }
}
</script>
