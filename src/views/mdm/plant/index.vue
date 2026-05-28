<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="工厂代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入工厂代码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工厂名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入工厂名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工厂类型" prop="plantType">
        <el-select v-model="queryParams.plantType" placeholder="请选择工厂类型" clearable style="width: 150px">
          <el-option
            v-for="item in plantTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="国家" prop="country">
        <el-input
          v-model="queryParams.country"
          placeholder="请输入国家"
          clearable
          style="width: 120px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="包含停用">
        <el-checkbox v-model="queryParams.includeInactive">包含停用数据</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['mdm:plant:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['mdm:plant:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['mdm:plant:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['mdm:plant:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="plantList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="工厂代码" prop="code" width="120"/>
      <el-table-column label="工厂名称" prop="name"/>
      <el-table-column label="工厂类型" prop="plantType" width="120">
        <template slot-scope="scope">
          {{ getPlantTypeLabel(scope.row.plantType) }}
        </template>
      </el-table-column>
      <el-table-column label="国家" prop="country" width="80"/>
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center"/>
      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['mdm:plant:edit']"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
            v-hasPermi="['mdm:plant:remove']"
          >停用</el-button>
          <el-button
            v-if="scope.row.status === 'DRAFT'"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['mdm:plant:remove']"
          >删除</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleHistory(scope.row)"
            v-hasPermi="['mdm:plant:query']"
          >查看历史</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.size"
      @pagination="getList"
    />

    <!-- 添加或修改工厂对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <!-- 基本信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工厂代码" prop="code">
              <el-input v-model="form.code" :readonly="form.code !== undefined && form.id !== undefined" placeholder="请输入工厂代码"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工厂名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入工厂名称"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="英文名称" prop="nameEn">
              <el-input v-model="form.nameEn" placeholder="请输入英文名称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="简称" prop="shortName">
              <el-input v-model="form.shortName" placeholder="请输入简称"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工厂类型" prop="plantType">
              <el-select v-model="form.plantType" placeholder="请选择工厂类型">
                <el-option
                  v-for="item in plantTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" placeholder="请输入描述"/>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 地址信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="国家" prop="country">
              <el-input v-model="form.country" placeholder="请输入国家"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="省份" prop="province">
              <el-input v-model="form.province" placeholder="请输入省份"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="城市" prop="city">
              <el-input v-model="form.city" placeholder="请输入城市"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地址" prop="address">
              <el-input v-model="form.address" placeholder="请输入地址"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="经度" prop="longitude">
              <el-input-number v-model="form.longitude" :precision="6" :step="0.000001" controls-position="right"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="latitude">
              <el-input-number v-model="form.latitude" :precision="6" :step="0.000001" controls-position="right"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="时区" prop="timezone">
              <el-input v-model="form.timezone" placeholder="请输入时区"/>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 生产信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年产能" prop="annualCapacity">
              <el-input-number v-model="form.annualCapacity" :min="0" controls-position="right"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产线数量" prop="productionLines">
              <el-input-number v-model="form.productionLines" :min="0" controls-position="right"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运营开始日期" prop="operationalStartDate">
              <el-date-picker v-model="form.operationalStartDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期"/>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 系统信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="法人实体编码" prop="legalEntityCode">
              <el-input v-model="form.legalEntityCode" placeholder="请输入法人实体编码"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本中心编码" prop="costCenterCode">
              <el-input v-model="form.costCenterCode" placeholder="请输入成本中心编码"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="MES实例" prop="mesInstance">
              <el-input v-model="form.mesInstance" placeholder="请输入MES实例"/>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 有效期 -->
        <el-row :gutter="20">
          <el-col :span="24">
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
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 历史版本对话框 -->
    <history-snapshot
      v-model="historyVisible"
      :loading="historyLoading"
      :history-list="historyList"
      :fields="historyFields"
    >
      <template #detail-fields="{ data }">
        <el-form-item label="工厂代码">{{ data.code }}</el-form-item>
        <el-form-item label="工厂名称">{{ data.name }}</el-form-item>
        <el-form-item label="英文名称">{{ data.nameEn }}</el-form-item>
        <el-form-item label="简称">{{ data.shortName }}</el-form-item>
        <el-form-item label="工厂类型">{{ getPlantTypeLabel(data.plantType) }}</el-form-item>
        <el-form-item label="国家">{{ data.country }}</el-form-item>
        <el-form-item label="省份">{{ data.province }}</el-form-item>
        <el-form-item label="城市">{{ data.city }}</el-form-item>
        <el-form-item label="地址">{{ data.address }}</el-form-item>
        <el-form-item label="年产能">{{ data.annualCapacity }}</el-form-item>
        <el-form-item label="生产线数量">{{ data.productionLines }}</el-form-item>
        <el-form-item label="运营开始日期">{{ parseTime(data.operationalStartDate) }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ getStatusLabel(data.status) }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
        <el-form-item label="操作类型">{{ data.operationType }}</el-form-item>
        <el-form-item label="快照时间">{{ parseTime(data.snapshotTime) }}</el-form-item>
        <el-form-item label="操作人">{{ data.operator }}</el-form-item>
      </template>
    </history-snapshot>
  </div>
</template>

<script>
export default {
  name: 'MdmPlant'
}
</script>
